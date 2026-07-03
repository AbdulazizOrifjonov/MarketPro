import { prisma } from '../lib/prisma.js';
import { verifyOtp } from '../services/otp.service.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken } from '../utils/jwt.js';

function normalizePhone(phone) {
  return (phone || '').replace(/\D/g, '').replace(/^0+/, '');
}

function publicUser(user) {
  const { passwordHash, resetToken, resetTokenExpiry, ...rest } = user;
  return rest;
}

async function provisionCartAndWishlist(userId) {
  const [cart, wishlist] = await Promise.all([
    prisma.cart.findUnique({ where: { userId } }),
    prisma.wishlist.findUnique({ where: { userId } }),
  ]);
  const ops = [];
  if (!cart) ops.push(prisma.cart.create({ data: { userId } }));
  if (!wishlist) ops.push(prisma.wishlist.create({ data: { userId } }));
  if (ops.length) await Promise.all(ops);
}

// POST /api/auth/request-verification
export const requestVerification = asyncHandler(async (req, res) => {
  const { phone, email } = req.body;
  const normalized = normalizePhone(phone);

  if (!normalized || !/^998\d{9}$/.test(normalized)) {
    throw new AppError(
      "Telefon raqam noto'g'ri. +998XXXXXXXXX formatida kiriting",
      400,
      'INVALID_PHONE'
    );
  }

  const fullPhone = `+${normalized}`;

  // Rate limit: max 1 request per 60 seconds per phone
  const recent = await prisma.verificationSession.findFirst({
    where: {
      phone: fullPhone,
      createdAt: { gt: new Date(Date.now() - 60_000) },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (recent) {
    const waitSec = Math.ceil((recent.createdAt.getTime() + 60_000 - Date.now()) / 1000);
    throw new AppError(`Iltimos, ${waitSec} soniya kuting`, 429, 'RATE_LIMITED');
  }

  // Rate limit: max 5 requests per hour per phone
  const hourlyCount = await prisma.verificationSession.count({
    where: {
      phone: fullPhone,
      createdAt: { gt: new Date(Date.now() - 3_600_000) },
    },
  });

  if (hourlyCount >= 5) {
    throw new AppError(
      "1 soat ichida maksimal urinishlar soni (5 ta) oshdi. Keyinroq urinib ko'ring.",
      429,
      'TOO_MANY_REQUESTS'
    );
  }

  const session = await prisma.verificationSession.create({
    data: {
      phone: fullPhone,
      email: email || undefined,
      expiresAt: new Date(Date.now() + 5 * 60_000),
    },
  });

  res.json({ sessionId: session.id });
});

// GET /api/auth/session-status/:sessionId
export const getSessionStatus = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const session = await prisma.verificationSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) throw new AppError('Session topilmadi', 404, 'NOT_FOUND');

  if (
    session.status !== 'COMPLETED' &&
    session.status !== 'EXPIRED' &&
    new Date() > session.expiresAt
  ) {
    await prisma.verificationSession.update({
      where: { id: sessionId },
      data: { status: 'EXPIRED' },
    });
    return res.json({ status: 'EXPIRED' });
  }

  res.json({ status: session.status });
});

// POST /api/auth/verify-otp
export const verifyOtpHandler = asyncHandler(async (req, res) => {
  const { sessionId, otp } = req.body;

  const session = await prisma.verificationSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) throw new AppError('Session topilmadi', 404, 'SESSION_NOT_FOUND');

  if (session.status === 'COMPLETED') {
    throw new AppError('Session allaqachon tasdiqlangan', 400, 'ALREADY_VERIFIED');
  }

  if (session.status === 'EXPIRED' || new Date() > session.expiresAt) {
    throw new AppError(
      'Session muddati tugagan. Iltimos, qaytadan boshlang.',
      400,
      'SESSION_EXPIRED'
    );
  }

  if (session.status === 'PENDING') {
    throw new AppError(
      "Avval Telegram botda telefon raqamingizni tasdiqlang.",
      400,
      'PHONE_NOT_VERIFIED'
    );
  }

  const otpRecord = await prisma.otpVerification.findUnique({ where: { sessionId } });

  if (!otpRecord) throw new AppError('OTP topilmadi', 404, 'OTP_NOT_FOUND');

  if (otpRecord.verified) {
    throw new AppError('Bu OTP allaqachon ishlatilgan', 400, 'OTP_USED');
  }

  if (new Date() > otpRecord.expiresAt) {
    throw new AppError(
      "OTP muddati tugagan (3 daqiqa). Qaytadan boshlang.",
      400,
      'OTP_EXPIRED'
    );
  }

  if (otpRecord.attempts >= 5) {
    await prisma.$transaction([
      prisma.otpVerification.delete({ where: { sessionId } }),
      prisma.verificationSession.update({
        where: { id: sessionId },
        data: { status: 'EXPIRED' },
      }),
    ]);
    throw new AppError(
      "5 ta noto'g'ri urinish. Qaytadan boshlang.",
      400,
      'MAX_ATTEMPTS_REACHED'
    );
  }

  const isValid = await verifyOtp(otp.toString().trim(), otpRecord.otpHash);

  if (!isValid) {
    const updated = await prisma.otpVerification.update({
      where: { sessionId },
      data: { attempts: { increment: 1 } },
    });
    const remaining = 4 - updated.attempts;
    throw new AppError(
      `Noto'g'ri kod. ${remaining > 0 ? `${remaining} ta urinish qoldi.` : "Boshqa urinish yo'q."}`,
      400,
      'INVALID_OTP'
    );
  }

  // OTP to'g'ri — foydalanuvchini topamiz yoki yaratamiz
  const phone = session.phone; // +998XXXXXXXXX
  const email = session.email; // from frontend input

  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { phone },
        { email: email || undefined }
      ]
    }
  });

  if (!user) {
    const tgAccount = await prisma.telegramAccount.findUnique({
      where: { telegramId: otpRecord.telegramId },
    });

    const firstName = tgAccount?.firstName || '';
    const lastName = tgAccount?.lastName || '';
    const name =
      [firstName, lastName].filter(Boolean).join(' ') || `Foydalanuvchi ${phone.slice(-4)}`;

    // Use email from session (frontend input), fallback to placeholder
    const finalEmail = email || `tg_${otpRecord.telegramId}@telegram.marketpro.local`;

    user = await prisma.user.create({
      data: {
        name,
        email: finalEmail,
        phone,
        telegramId: otpRecord.telegramId,
        phoneVerified: true,
        role: 'CUSTOMER',
      },
    });

    await provisionCartAndWishlist(user.id);

    if (tgAccount) {
      try {
        await prisma.telegramAccount.update({
          where: { id: tgAccount.id },
          data: { userId: user.id },
        });
      } catch {
        // userId might already be taken if race condition
      }
    }
  } else {
    // Mavjud foydalanuvchi — phoneVerified ni yangilaymiz
    const updateData = { phoneVerified: true };
    if (!user.telegramId && otpRecord.telegramId) {
      updateData.telegramId = otpRecord.telegramId;
    }
    if (!user.email && email) {
      updateData.email = email;
    }
    user = await prisma.user.update({ where: { id: user.id }, data: updateData });

    // TelegramAccount ni ham foydalanuvchiga bog'laymiz
    try {
      await prisma.telegramAccount.update({
        where: { telegramId: otpRecord.telegramId },
        data: { userId: user.id },
      });
    } catch {
      // ignore if already linked or doesn't exist
    }
  }

  await prisma.$transaction([
    prisma.otpVerification.update({ where: { sessionId }, data: { verified: true } }),
    prisma.verificationSession.update({ where: { id: sessionId }, data: { status: 'COMPLETED' } }),
  ]);

  const token = signToken({ sub: user.id, role: user.role });
  res.json({ token, user: publicUser(user) });
});
