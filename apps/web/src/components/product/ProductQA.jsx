import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';

export function ProductQA({ slug }) {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setIsLoading(true);
    api
      .get(`/questions/${slug}`)
      .then(({ data }) => setQuestions(data.questions))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [slug]);

  async function submitQuestion(e) {
    e.preventDefault();
    if (!question.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/questions/${slug}`, { question });
      setQuestion('');
      toast.success(t('product.ask_question'));
      load();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {isAuthenticated && (
        <form onSubmit={submitQuestion} className="flex gap-2">
          <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={t('product.ask_question')} />
          <Button type="submit" disabled={submitting || !question.trim()}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('common.add')}
          </Button>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : questions.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('common.no_results')}</p>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="rounded-xl border border-border p-4">
              <div className="flex items-start gap-2">
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium">{q.question}</p>
                  <p className="text-xs text-muted-foreground">{q.user.name}</p>
                </div>
              </div>
              {q.answer && (
                <div className="ml-6 mt-2 rounded-lg bg-muted p-3 text-sm">
                  <span className="font-semibold text-primary">MarketPro: </span>
                  {q.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
