import { Telegraf, Markup } from 'telegraf';
import { prisma } from '../lib/prisma.js';
import { generateOtp, hashOtp } from './otp.service.js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
let bot = null;

export function getBot() { return bot; }

export function stopBot() {
  if (bot) {
    try { bot.stop(); } catch (e) {}
  }
}

function normalizePhone(p) {
  return (p || '').replace(/\D/g, '').replace(/^0+/, '');
}

// ─── THE contact-request keyboard ────────────────────────────────────────────
const SHARE_KEYBOARD = Markup.keyboard([
  [Markup.button.contactRequest('📱 Telefon raqamni ulashish')],
])
  .resize()
  .oneTime();

// ─── /start ──────────────────────────────────────────────────────────────────
async function onStart(ctx) {
  if (ctx.chat.type !== 'private') return;

  const chatId = ctx.chat.id;
  const sessionId = (ctx.startPayload || '').trim();

  console.log(`[Bot] /start  chatId=${chatId}  session="${sessionId}"`);

  // Always show the keyboard right away — no DB dependency for this step
  await ctx.replyWithHTML(
    '👋 Salom!\n\n' +
    '<b>DELUX</b> ga xush kelibsiz.\n\n' +
    'Tasdiqlash kodini olish uchun quyidagi tugmani bosing 👇',
    SHARE_KEYBOARD
  );

  // Link chatId to the session so the contact handler can find it
  if (sessionId) {
    try {
      const r = await prisma.verificationSession.updateMany({
        where: { id: sessionId, status: 'PENDING', expiresAt: { gt: new Date() } },
        data: { chatId: String(chatId) },
      });
      console.log(`[Bot] session linked: ${r.count} row(s) for sessionId=${sessionId}`);
    } catch (err) {
      console.error('[Bot] session link error:', err.message);
    }
  }
}

// ─── Contact received ─────────────────────────────────────────────────────────
async function onContact(ctx) {
  if (ctx.chat.type !== 'private') return;

  const chatId = ctx.chat.id;
  const contact = ctx.message.contact;
  const telegramId = String(contact.user_id ?? ctx.from.id);
  const tgPhone = normalizePhone(contact.phone_number);
  const fullTgPhone = `+${tgPhone}`;

  console.log(`[Bot] contact  chatId=${chatId}  phone=${contact.phone_number} (${fullTgPhone})  tgId=${telegramId}`);

  // 1. Try to find the pending session by chatId
  let session = await prisma.verificationSession.findFirst({
    where: { chatId: String(chatId), status: 'PENDING', expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });

  // 2. Fallback: Try to find pending session by phone number matching tgPhone!
  if (!session) {
    session = await prisma.verificationSession.findFirst({
      where: {
        OR: [
          { phone: fullTgPhone },
          { phone: tgPhone },
        ],
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (session) {
      // Link chatId to session now
      await prisma.verificationSession.update({
        where: { id: session.id },
        data: { chatId: String(chatId) },
      }).catch((e) => console.warn('[Bot] session update chatId error:', e.message));
    }
  }

  if (!session) {
    await ctx.reply(
      '❌ Faol tasdiqlash sessiyasi topilmadi.\n\nSaytga qaytib raqamingizni kiriting va qaytadan boshlang.',
      Markup.removeKeyboard()
    );
    return;
  }

  // Compare phone numbers
  const sessionPhone = normalizePhone(session.phone);

  if (tgPhone !== sessionPhone) {
    await ctx.replyWithHTML(
      `❌ <b>Raqamlar mos kelmadi!</b>\n\n` +
      `Saytda kiriting: <code>+${sessionPhone}</code>\n` +
      `Telegram:        <code>+${tgPhone}</code>\n\n` +
      `Saytga qaytib to'g'ri raqam kiriting va qaytadan boshlang.`,
      Markup.removeKeyboard()
    );
    return;
  }

  // Persist TelegramAccount
  await prisma.telegramAccount
    .upsert({
      where: { telegramId },
      create: {
        telegramId,
        chatId: String(chatId),
        phone: tgPhone,
        firstName: contact.first_name || ctx.from.first_name || null,
        lastName:  contact.last_name  || ctx.from.last_name  || null,
        username:  ctx.from.username  || null,
      },
      update: {
        chatId:    String(chatId),
        phone:     tgPhone,
        firstName: contact.first_name || ctx.from.first_name || null,
        lastName:  contact.last_name  || ctx.from.last_name  || null,
        username:  ctx.from.username  || null,
      },
    })
    .catch((e) => console.warn('[Bot] TelegramAccount upsert:', e.message));

  // Generate OTP
  const otp       = generateOtp();
  const otpHash   = await hashOtp(otp);
  const expiresAt = new Date(Date.now() + 5 * 60_000); // 5 minutes

  await prisma.$transaction(async (tx) => {
    await tx.otpVerification.deleteMany({ where: { sessionId: session.id } });
    await tx.otpVerification.create({
      data: { sessionId: session.id, telegramId, otpHash, expiresAt },
    });
    await tx.verificationSession.update({
      where: { id: session.id },
      data: { status: 'OTP_SENT' },
    });
  });

  // Send OTP — keyboard removed
  await ctx.replyWithHTML(
    `✅ <b>Telefon tasdiqlandi!</b>\n\n` +
    `🔑 Tasdiqlash kodingiz:\n\n` +
    `<code>${otp}</code>\n\n` +
    `⏱ <b>5 daqiqa</b> ichida amal qiladi.\n\n` +
    `⚠️ <i>Kodni hech kimga bermang!</i>`,
    Markup.removeKeyboard()
  );

  console.log(`[Bot] ✓ OTP sent successfully to chatId=${chatId}`);
}

// ─── Other messages ───────────────────────────────────────────────────────────
async function onMessage(ctx) {
  if (ctx.chat.type !== 'private') return;
  if (ctx.message.contact) return;

  const chatId = String(ctx.chat.id);
  const tgPhone = normalizePhone(ctx.from.phone_number || '');

  const has = await prisma.verificationSession.count({
    where: {
      OR: [
        { chatId },
        { phone: `+${tgPhone}` },
      ],
      status: 'PENDING',
      expiresAt: { gt: new Date() },
    },
  });

  if (has) {
    await ctx.reply('👆 Tasdiqlash uchun quyidagi tugmani bosing:', SHARE_KEYBOARD);
  } else {
    await ctx.reply('ℹ️ Tasdiqlash uchun saytdan boshlang.', Markup.removeKeyboard());
  }
}

// ─── Start ────────────────────────────────────────────────────────────────────
export function startBot() {
  if (!BOT_TOKEN) {
    console.warn('[Bot] TELEGRAM_BOT_TOKEN topilmadi — bot o\'chirilgan');
    return;
  }

  bot = new Telegraf(BOT_TOKEN);

  bot.start ((ctx) => onStart  (ctx).catch((e) => console.error('[Bot /start]', e)));
  bot.on('contact', (ctx) => onContact(ctx).catch((e) => console.error('[Bot contact]', e)));
  bot.on('message', (ctx) => onMessage(ctx).catch((e) => console.error('[Bot message]', e)));

  bot.catch((err) => console.error('[Bot] unhandled:', err));

  bot
    .launch({ dropPendingUpdates: true })
    .then(() => console.log('[Bot] ✓ DELUX Telegram Bot ishga tushdi'))
    .catch((err) => console.error('[Bot] ✗ ishga tushmadi:', err.message));

  process.once('SIGINT',  () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}
