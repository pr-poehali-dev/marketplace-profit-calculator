import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { ProductData } from './types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIConsultantProps {
  currentProduct: ProductData;
}

const QUICK_QUESTIONS = [
  'Сколько стоит доставка на Wildberries?',
  'Какие требования к упаковке на Ozon?',
  'За сколько продавать мой товар?',
  'Каковы тарифы хранения на складе?',
  'Какой процент выкупа у моей категории?',
];

const AI_URL = 'https://functions.poehali.dev/4f6034d7-9cad-4291-8c14-8e89fc8ff9d5';

const AIConsultant = ({ currentProduct }: AIConsultantProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Привет! Я AI-консультант по маркетплейсам 👋\n\nПомогу разобраться со стоимостью доставки, хранения, требованиями к упаковке и ценообразованием${currentProduct.name ? ` для товара «${currentProduct.name}»` : ''}.\n\nЧто вас интересует?`,
      }]);
    }
  }, [isOpen]);

  const buildProductContext = () => {
    if (!currentProduct.name) return '';
    return `Товар: ${currentProduct.name}
Закупочная цена: ${currentProduct.purchasePrice} ₽
Цена продажи до скидки: ${currentProduct.priceBeforeDiscount} ₽
Скидка: ${currentProduct.discount}%
Количество: ${currentProduct.quantity} шт.
Комиссия МП: ${currentProduct.marketplaceCommission}%
Стоимость упаковки: ${currentProduct.packagingCost} ₽
Стоимость доставки: ${currentProduct.deliveryCost} ₽
Процент выкупа: ${currentProduct.redemptionRate}%`;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(AI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          productContext: buildProductContext(),
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages([...newMessages, { role: 'assistant', content: 'Произошла ошибка. Попробуйте снова.' }]);
      }
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Не удалось соединиться с сервером. Проверьте интернет-соединение.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 h-12 w-12 md:h-14 md:w-14 rounded-full shadow-lg"
        size="icon"
        title="AI-консультант"
      >
        <Icon name="Bot" size={22} />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 md:inset-auto md:bottom-24 md:right-6 md:w-[380px] md:max-w-[calc(100vw-24px)]">
          <Card className="flex flex-col shadow-2xl border-0 md:border-2 rounded-none md:rounded-lg h-full md:h-[520px]">
            <div className="flex items-center justify-between p-3 md:p-4 border-b bg-primary text-primary-foreground md:rounded-t-lg safe-top">
              <div className="flex items-center gap-2">
                <Icon name="Bot" size={20} />
                <div>
                  <p className="font-semibold text-sm">AI-консультант</p>
                  <p className="text-xs opacity-80">Маркетплейсы · Доставка · Цены</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs bg-green-500 text-white border-0 hidden sm:inline-flex">онлайн</Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 md:h-8 md:w-8 hover:bg-primary-foreground/20 text-primary-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  <Icon name="X" size={18} />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {messages.length <= 1 && (
              <div className="px-4 pb-2">
                <p className="text-xs text-muted-foreground mb-2">Быстрые вопросы:</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="text-xs bg-muted hover:bg-muted/80 rounded-full px-3 py-1.5 transition-colors text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3 border-t safe-bottom">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Спросите что-нибудь..."
                  rows={1}
                  className="flex-1 resize-none rounded-xl border bg-background px-3 py-2.5 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[40px] max-h-[100px]"
                  style={{ overflow: 'hidden' }}
                  onInput={(e) => {
                    const t = e.target as HTMLTextAreaElement;
                    t.style.height = 'auto';
                    t.style.height = Math.min(t.scrollHeight, 100) + 'px';
                  }}
                />
                <Button
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-xl"
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                >
                  <Icon name="Send" size={16} />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2 hidden md:block">Enter — отправить · Shift+Enter — новая строка</p>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default AIConsultant;