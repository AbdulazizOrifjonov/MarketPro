import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Phone,
  Send,
  MessageCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  ArrowLeft,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 12);
  if (digits.startsWith('998')) {
    const rest = digits.slice(3);
    let out = '+998';
    if (rest.length > 0) out += ' ' + rest.slice(0, 2);
    if (rest.length > 2) out += ' ' + rest.slice(2, 5);
    if (rest.length > 5) out += ' ' + rest.slice(5, 7);
    if (rest.length > 7) out += ' ' + rest.slice(7, 9);
    return out;
  }
  if (digits.length > 0 && !digits.startsWith('9')) {
    return '+998 ';
  }
  return digits ? '+' + digits : '';
}

function toApiPhone(formatted) {
  return '+' + formatted.replace(/\D/g, '');
}

// ─── OTP 6-box input ──────────────────────────────────────────────────────────

function OtpInput({ value, onChange, disabled }) {
  const refs = useRef([]);
  const digits = value.split('');

  function handleKeyDown(idx, e) {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        const next = [...digits];
        next[idx] = '';
        onChange(next.join(''));
      } else if (idx > 0) {
        refs.current[idx - 1]?.focus();
      }
    }
    if (e.key === 'ArrowLeft' && idx > 0) refs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < 5) refs.current[idx + 1]?.focus();
  }

  function handleInput(idx, e) {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    if (!char) return;
    const next = [...digits];
    next[idx] = char;
    onChange(next.join(''));
    if (idx < 5) refs.current[idx + 1]?.focus();
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      onChange(pasted.padEnd(6, '').slice(0, 6));
      const focusIdx = Math.min(pasted.length, 5);
      refs.current[focusIdx]?.focus();
    }
    e.preventDefault();
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {Array.from({ length: 6 }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => (refs.current[idx] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[idx] || ''}
          onChange={(e) => handleInput(idx, e)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={cn(
            'h-12 w-10 rounded-xl border-2 bg-background text-center text-lg font-bold transition-all focus:outline-none sm:h-14 sm:w-12',
            digits[idx]
              ? 'border-primary text-foreground'
              : 'border-border text-muted-foreground',
            'focus:border-primary focus:ring-2 focus:ring-primary/20',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        />
      ))}
    </div>
  );
}

// ─── Countdown timer hook ─────────────────────────────────────────────────────

function useCountdown(initialSeconds) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  return { seconds, reset: (s) => setSeconds(s ?? initialSeconds), isDone: seconds === 0 };
}

// ─── Main component ───────────────────────────────────────────────────────────

const STEPS = { PHONE: 'PHONE', WAITING: 'WAITING', OTP: 'OTP', SUCCESS: 'SUCCESS' };
const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'MarketProVerifyBot';

export default function PhoneVerify() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const [step, setStep] = useState(STEPS.PHONE);
  const [phone, setPhone] = useState('+998 ');
  const [email, setEmail] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [telegramOpened, setTelegramOpened] = useState(false);

  const waitingTimer = useCountdown(300); // 5 min session
  const otpTimer = useCountdown(180); // 3 min OTP
  const resendTimer = useCountdown(60); // 60s before resend

  const pollRef = useRef(null);

  // ── Stop polling cleanup ────────────────────────────────────────────────────
  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  useEffect(() => () => stopPolling(), []);

  // ── Start polling for session status ────────────────────────────────────────
  const startPolling = useCallback((sid) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/auth/session-status/${sid}`);
        if (data.status === 'OTP_SENT') {
          stopPolling();
          otpTimer.reset(180);
          setStep(STEPS.OTP);
        } else if (data.status === 'EXPIRED') {
          stopPolling();
          toast.error('Session muddati tugagan. Qaytadan boshlang.');
          setStep(STEPS.PHONE);
        } else if (data.status === 'COMPLETED') {
          stopPolling();
          setStep(STEPS.OTP);
        }
      } catch {
        // Ignore polling errors
      }
    }, 2000);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Step 1: Request verification ────────────────────────────────────────────
  async function handleRequestVerification() {
    const apiPhone = toApiPhone(phone);
    const digits = apiPhone.replace(/\D/g, '');
    const trimmedEmail = email.trim();

    setPhoneError('');
    setEmailError('');

    if (!/^998\d{9}$/.test(digits)) {
      setPhoneError("To'liq raqam kiriting. Masalan: +998 90 123 45 67");
      return;
    }

    if (!trimmedEmail) {
      setEmailError("Email kerak");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setEmailError("Email noto'g'ri. Masalan: user@example.com");
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/request-verification', { phone: apiPhone, email: trimmedEmail });
      setSessionId(data.sessionId);
      waitingTimer.reset(300);
      resendTimer.reset(60);
      setTelegramOpened(false);
      setStep(STEPS.WAITING);
      startPolling(data.sessionId);
    } catch (err) {
      setPhoneError(err.friendlyMessage || "Xatolik yuz berdi. Qaytadan urinib ko'ring.");
    } finally {
      setIsLoading(false);
    }
  }

  // ── Open Telegram bot link ──────────────────────────────────────────────────
  function openTelegram() {
    const url = `https://t.me/${BOT_USERNAME}?start=${sessionId}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setTelegramOpened(true);
  }

  // ── Step 3: Verify OTP ──────────────────────────────────────────────────────
  async function handleVerifyOtp(otpValue) {
    const val = otpValue ?? otp;
    if (val.length !== 6) return;
    setOtpError('');
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { sessionId, otp: val });
      setSession(data.token, data.user, true);
      setStep(STEPS.SUCCESS);
      setTimeout(() => {
        navigate(data.user.role === 'ADMIN' ? '/admin' : '/');
      }, 1800);
    } catch (err) {
      setOtpError(err.friendlyMessage || "Noto'g'ri kod. Qaytadan urinib ko'ring.");
      if (
        err.response?.data?.error?.code === 'MAX_ATTEMPTS_REACHED' ||
        err.response?.data?.error?.code === 'SESSION_EXPIRED' ||
        err.response?.data?.error?.code === 'OTP_EXPIRED'
      ) {
        setTimeout(() => setStep(STEPS.PHONE), 2000);
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Auto-submit when 6 digits filled
  useEffect(() => {
    if (otp.length === 6 && step === STEPS.OTP) {
      handleVerifyOtp(otp);
    }
  }, [otp]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Resend ──────────────────────────────────────────────────────────────────
  async function handleResend() {
    stopPolling();
    setOtp('');
    setOtpError('');
    await handleRequestVerification();
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (step === STEPS.SUCCESS) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Muvaffaqiyatli kirdingiz!</h2>
          <p className="mt-1 text-sm text-muted-foreground">Bosh sahifaga yo'naltirilmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0088cc]/10">
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-[#0088cc]">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-2.044 9.626c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.907.595z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold">Telegram orqali kirish</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {step === STEPS.PHONE && 'Telefon raqamingizni kiriting'}
            {step === STEPS.WAITING && 'Telegram botni oching'}
            {step === STEPS.OTP && 'Tasdiqlash kodini kiriting'}
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-2">
        {[STEPS.PHONE, STEPS.WAITING, STEPS.OTP].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all',
                step === s
                  ? 'bg-primary text-primary-foreground'
                  : [STEPS.WAITING, STEPS.OTP].indexOf(step) > i
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {[STEPS.WAITING, STEPS.OTP].indexOf(step) > i ? '✓' : i + 1}
            </div>
            {i < 2 && <div className={cn('h-px flex-1 transition-all', [STEPS.WAITING, STEPS.OTP].indexOf(step) > i ? 'bg-primary/40' : 'bg-border')} style={{ width: 32 }} />}
          </div>
        ))}
      </div>

      {/* ── STEP 1: Phone input ───────────────────────────────────────────────── */}
      {step === STEPS.PHONE && (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => {
                setEmailError('');
                setEmail(e.target.value);
              }}
              placeholder="user@example.com"
              className="text-base"
              autoFocus
            />
            {emailError && <p className="mt-1.5 text-xs text-destructive">{emailError}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Telefon raqam</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => {
                  setPhoneError('');
                  setPhone(formatPhone(e.target.value));
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleRequestVerification()}
                placeholder="+998 90 123 45 67"
                className="pl-9 text-base"
              />
            </div>
            {phoneError && <p className="mt-1.5 text-xs text-destructive">{phoneError}</p>}
            <p className="mt-1.5 text-xs text-muted-foreground">
              O'zbekiston raqami (+998 XX XXX XX XX)
            </p>
          </div>

          <Button
            className="w-full gap-2"
            onClick={handleRequestVerification}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Tasdiqlash kodini yuborish
          </Button>

          <div className="rounded-xl bg-muted/50 p-4 text-xs text-muted-foreground">
            <p className="font-medium text-foreground/80">Qanday ishlaydi?</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>Raqamingizni kiritasiz</li>
              <li>Telegram botni ochasiz</li>
              <li>Kontaktni ulashish tugmasini bosasiz</li>
              <li>6 xonali kodni saytga kiritasiz</li>
            </ol>
          </div>
        </div>
      )}

      {/* ── STEP 2: Waiting for Telegram ─────────────────────────────────────── */}
      {step === STEPS.WAITING && (
        <div className="space-y-5">
          {/* Telegram open button */}
          <button
            onClick={openTelegram}
            className="group flex w-full items-center gap-4 rounded-2xl border-2 border-[#0088cc]/30 bg-[#0088cc]/5 p-4 text-left transition-all hover:border-[#0088cc]/60 hover:bg-[#0088cc]/10"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0088cc] shadow-lg">
              <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-2.044 9.626c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.907.595z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">
                {telegramOpened ? 'Telegram ochildi' : 'Telegramni oching'}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                @{BOT_USERNAME} boti
              </p>
            </div>
            <div className="shrink-0 text-xs font-medium text-[#0088cc]">
              {telegramOpened ? '✓ Ochildi' : 'Ochish →'}
            </div>
          </button>

          {/* Instructions */}
          {telegramOpened && (
            <div className="rounded-xl border border-border bg-card p-4 text-sm">
              <p className="font-medium">Telegram botda:</p>
              <ol className="mt-2 list-decimal space-y-2 pl-5 text-muted-foreground">
                <li><b className="text-foreground">START</b> tugmasini bosing</li>
                <li>
                  <b className="text-foreground">"📱 Telefon raqamimni ulashish"</b>
                  <br />
                  tugmasini bosing
                </li>
                <li>Tasdiqlash kodi bu yerga keladi</li>
              </ol>
            </div>
          )}

          {/* Waiting animation */}
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-2.5 w-2.5 rounded-full bg-primary/60 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Telegram tasdiqlash kutilmoqda...
            </p>
          </div>

          {/* Timer */}
          <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-4 w-4" />
              Session tugashiga:
            </div>
            <span className="font-mono font-semibold">
              {String(Math.floor(waitingTimer.seconds / 60)).padStart(2, '0')}:
              {String(waitingTimer.seconds % 60).padStart(2, '0')}
            </span>
          </div>

          {/* Resend + back */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => { stopPolling(); setStep(STEPS.PHONE); }}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Orqaga
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={handleResend}
              disabled={!resendTimer.isDone || isLoading}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {resendTimer.isDone
                ? 'Qayta yuborish'
                : `Qayta yuborish (${resendTimer.seconds}s)`}
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 3: OTP input ────────────────────────────────────────────────── */}
      {step === STEPS.OTP && (
        <div className="space-y-5">
          <div className="flex flex-col items-center gap-2 rounded-xl bg-primary/5 p-4 text-center">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <p className="text-sm">
              Kod <b>Telegram</b> botdan yuborildi.
            </p>
            <p className="text-xs text-muted-foreground">
              6 xonali kodni pastga kiriting
            </p>
          </div>

          <OtpInput value={otp} onChange={setOtp} disabled={isLoading} />

          {otpError && (
            <p className="text-center text-sm text-destructive">{otpError}</p>
          )}

          {/* Timer */}
          <div className={cn(
            'flex items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-sm font-mono font-semibold',
            otpTimer.isDone ? 'bg-destructive/10 text-destructive' : 'bg-muted/40 text-foreground'
          )}>
            <Clock className="h-4 w-4" />
            {otpTimer.isDone
              ? 'Kod muddati tugadi'
              : `${String(Math.floor(otpTimer.seconds / 60)).padStart(2, '0')}:${String(otpTimer.seconds % 60).padStart(2, '0')}`}
          </div>

          <Button
            className="w-full gap-2"
            onClick={() => handleVerifyOtp(otp)}
            disabled={otp.length !== 6 || isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Tasdiqlash
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => { stopPolling(); setStep(STEPS.PHONE); }}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Orqaga
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={handleResend}
              disabled={!resendTimer.isDone || isLoading}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {resendTimer.isDone
                ? 'Yangi kod'
                : `Yangi kod (${resendTimer.seconds}s)`}
            </Button>
          </div>
        </div>
      )}

      {/* Bottom link */}
      {step === STEPS.PHONE && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Parol orqali kirish?{' '}
          <button
            onClick={() => navigate('/login')}
            className="font-semibold text-primary hover:underline"
          >
            Kirish
          </button>
        </p>
      )}
    </div>
  );
}
