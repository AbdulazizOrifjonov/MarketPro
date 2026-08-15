import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';

export function PostPurchaseFeedbackModal() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [pendingItems, setPendingItems] = useState([]);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!user) {
      setShowBanner(false);
      return;
    }

    // Always check for pending delivered feedback on login / page refresh
    api
      .get('/reviews/pending-feedback')
      .then(({ data }) => {
        if (data.pendingItems && data.pendingItems.length > 0) {
          setPendingItems(data.pendingItems);
          setShowBanner(true);
        } else {
          setShowBanner(false);
        }
      })
      .catch(() => {});
  }, [user]);

  if (!showBanner || pendingItems.length === 0) return null;

  const currentItem = pendingItems[0];

  function handleGoToAccountReviews(e) {
    if (e) e.stopPropagation();
    navigate('/account/reviews');
  }

  return (
    <div
      onClick={handleGoToAccountReviews}
      className="relative fixed bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-xl h-[100px] sm:h-[130px] md:h-[150px] rounded-2xl border-2 border-primary/40 bg-card/95 backdrop-blur-xl shadow-2xl p-2.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:border-primary hover:shadow-primary/20 transition-all duration-300 animate-in slide-in-from-bottom-5"
    >
      {/* Top-Right Corner Close 'X' Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowBanner(false);
        }}
        className="absolute -top-3 -right-3 z-20 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg hover:bg-destructive/90 hover:scale-110 active:scale-95 transition-all"
        title="Yopish"
      >
        <X className="h-4 w-4 stroke-[2.5]" />
      </button>

      {/* Left Product Image */}
      <div className="relative shrink-0">
        <img
          src={currentItem.productImage}
          alt={currentItem.productName}
          className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-xl object-cover border border-border shadow-sm"
        />
        <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow">
          ✓
        </span>
      </div>

      {/* Center Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-primary">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Yetkazildi — Baho bering!</span>
        </div>
        <h4 className="font-heading font-extrabold text-xs sm:text-sm md:text-base text-foreground truncate mt-0.5">
          {currentItem.productName}
        </h4>
        <div className="flex items-center gap-1 mt-1 text-amber-400">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-amber-400" />
          ))}
          <span className="ml-1 text-[11px] font-semibold text-muted-foreground">
            ({pendingItems.length} ta mahsulot)
          </span>
        </div>
      </div>

      {/* Right Action Button */}
      <div className="shrink-0 flex flex-col gap-1 items-end pr-1">
        <Button
          size="sm"
          onClick={handleGoToAccountReviews}
          className="gap-1 rounded-xl font-bold bg-primary hover:bg-primary/90 text-xs sm:text-sm px-3 sm:px-4 py-2 shadow-md"
        >
          <span>Baho berish</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
