import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const API_AUTH = 'https://functions.poehali.dev/46100039-333d-4e3d-a568-053845ff2f33';
const API_USER = 'https://functions.poehali.dev/7755ca60-4d6b-40bd-92da-d18abfad90ca';

const PLANS = [
  { name: 'Неделя', price: 100, duration: '7 дней', type: 'week', days: 7 },
  { name: 'Месяц', price: 200, duration: '30 дней', type: 'month', days: 30 },
  { name: 'Год', price: 350, duration: '365 дней', type: 'year', days: 365 },
  { name: 'Навсегда', price: 500, duration: 'без ограничений', type: 'lifetime', days: null }
];

const FEATURES = [
  { icon: 'Zap', title: 'Максимальная оптимизация и стабильность', description: 'Высокая производительность без лагов' },
  { icon: 'Palette', title: 'Уникальный минималистичный интерфейс', description: 'Современный дизайн для комфортной игры' },
  { icon: 'Shield', title: 'Безопасность и защита данных', description: 'Полная конфиденциальность и защита' },
  { icon: 'Gem', title: 'Постоянные обновления и поддержка', description: 'Регулярные улучшения функционала' }
];

const PAYMENT_METHODS = [
  { name: 'YouMoney', url: 'https://yoomoney.ru/to/+bnDMvX7Ko67VDCR7RJECkb6', id: 'yoomoney' },
  { name: 'YouCassa', url: 'https://yookassa.ru/', id: 'yookassa' },
  { name: 'PSP', url: 'https://psp.ru/', id: 'psp' },
  { name: 'Sber', url: 'https://www.sberbank.ru/ru/person', id: 'sber' },
  { name: 'TBank', url: 'https://www.tbank.ru/', id: 'tbank' },
  { name: 'Крипта', url: 'https://www.binance.com/', id: 'crypto' }
];

const PROMO_CODES: Record<string, number> = {
  'Release': 0.20,
  'Delaros': 0.15
};

export default function Index() {
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [snowEnabled, setSnowEnabled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);
  const { toast } = useToast();

  const [registerForm, setRegisterForm] = useState({ email: '', username: '', password: '' });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRegister = async () => {
    try {
      const res = await fetch(API_AUTH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', ...registerForm })
      });
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem('user', JSON.stringify({ uid: data.uid, username: data.username }));
        setUser({ uid: data.uid, username: data.username });
        setShowRegister(false);
        toast({ title: 'Регистрация успешна!' });
      } else {
        toast({ title: 'Ошибка', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Ошибка сети', variant: 'destructive' });
    }
  };

  const handleLogin = async () => {
    try {
      const res = await fetch(API_AUTH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', ...loginForm })
      });
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
        setShowLogin(false);
        toast({ title: 'Вход выполнен!' });
      } else {
        toast({ title: 'Ошибка', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Ошибка сети', variant: 'destructive' });
    }
  };

  const applyPromoCode = () => {
    if (PROMO_CODES[promoCode]) {
      const discountPercent = PROMO_CODES[promoCode] * 100;
      setDiscount(PROMO_CODES[promoCode]);
      toast({ title: `Промокод применён!`, description: `Скидка ${discountPercent}%` });
    } else if (promoCode) {
      toast({ title: 'Неверный промокод', variant: 'destructive' });
    }
  };

  const calculateFinalPrice = () => {
    if (!selectedPlan) return 0;
    const price = selectedPlan.price;
    return Math.round(price - (price * discount));
  };

  const handleSelectPayment = (method: any) => {
    setSelectedPayment(method);
  };

  const handleFinalPayment = () => {
    if (!selectedPayment) {
      toast({ title: 'Выберите способ оплаты', variant: 'destructive' });
      return;
    }
    const price = calculateFinalPrice();
    window.open(selectedPayment.url, '_blank');
    toast({ title: `Переход на ${selectedPayment.name}`, description: `Сумма к оплате: ${price}₽` });
  };

  useEffect(() => {
    setFinalPrice(calculateFinalPrice());
  }, [selectedPlan, discount]);

  useEffect(() => {
    applyPromoCode();
  }, [promoCode]);

  const openProfile = () => {
    setShowProfile(true);
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  return (
    <div className="min-h-screen bg-black text-primary font-roboto relative overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-black via-primary/5 to-black backdrop-blur-sm -z-10" />
      {snowEnabled && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(80)].map((_, i) => {
            const size = 10 + Math.random() * 15;
            const duration = 8 + Math.random() * 12;
            const delay = Math.random() * 8;
            const startX = Math.random() * 100;
            return (
              <div
                key={i}
                className="absolute animate-snowfall text-white"
                style={{
                  left: `${startX}%`,
                  animationDuration: `${duration}s`,
                  animationDelay: `${delay}s`,
                  fontSize: `${size}px`,
                  opacity: 0.6 + Math.random() * 0.4
                }}
              >
                ❄
              </div>
            );
          })}
        </div>
      )}

      <header className="fixed top-0 w-full z-40 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-montserrat font-bold">AstrixClient</h1>
          <div className="flex items-center gap-4">
            {user ? (
              <Button onClick={openProfile} variant="outline" className="border-secondary text-secondary hover:bg-secondary hover:text-black">
                <Icon name="User" className="mr-2" size={18} />
                {user.username}
              </Button>
            ) : (
              <>
                <Button onClick={() => setShowLogin(true)} variant="ghost" className="text-primary hover:text-secondary">
                  Вход
                </Button>
                <Button onClick={() => setShowRegister(true)} className="bg-primary hover:bg-primary/90 text-white">
                  Создать аккаунт
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="pt-40 pb-20 px-6 text-center">
        <h2 className="text-7xl font-montserrat font-extrabold mb-6 animate-fade-in">
          AstrixClient
        </h2>
        <p className="text-2xl text-white/70 mb-12 font-light">
          Клиент для тех, кто хочет чувствовать преимущество
        </p>
        <div className="flex gap-6 justify-center mb-8">
          <Button onClick={() => scrollToSection('plans')} size="lg" className="bg-primary hover:bg-primary/90 text-white text-lg px-8 py-6">
            Купить
          </Button>
          <Button onClick={() => scrollToSection('features')} size="lg" variant="outline" className="border-secondary text-secondary hover:bg-secondary hover:text-black text-lg px-8 py-6">
            Преимущества
          </Button>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Checkbox id="snow" checked={snowEnabled} onCheckedChange={(checked) => setSnowEnabled(!!checked)} className="border-secondary" />
          <Label htmlFor="snow" className="text-white/70 cursor-pointer">Снег</Label>
        </div>
      </section>

      <section id="features" className="py-20 px-6">
        <h3 className="text-5xl font-montserrat font-bold text-center mb-16">НАШИ ПРЕИМУЩЕСТВА</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {FEATURES.map((feature, idx) => (
            <Card key={idx} className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-secondary/30 p-8 hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(125,211,252,0.3)]">
              <div className="bg-secondary/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Icon name={feature.icon} size={32} className="text-secondary" />
              </div>
              <h4 className="text-xl font-montserrat font-semibold mb-4 text-center text-white">{feature.title}</h4>
              <p className="text-white/60 text-center text-sm">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="plans" className="py-20 px-6">
        <h3 className="text-5xl font-montserrat font-bold text-center mb-16">ТАРИФЫ</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {PLANS.map((plan, idx) => (
            <Card key={idx} className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-secondary/30 p-8 flex flex-col hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(125,211,252,0.3)] min-h-[400px]">
              <div className="flex-1">
                <h4 className="text-3xl font-montserrat font-bold mb-6 text-white text-center">{plan.name}</h4>
                <p className="text-5xl font-bold text-primary mb-4 text-center">{plan.price}₽</p>
                <div className="space-y-4 text-white/70 text-center mb-8">
                  <p>При покупке подписки на <span className="text-secondary font-semibold">{plan.name.toLowerCase()}</span> вы получите:</p>
                  <p>✓ Все функции клиента</p>
                  <p>✓ Подписку на {plan.duration}</p>
                  <p className="text-secondary font-semibold">Это {plan.duration} в удовольствие!</p>
                </div>
              </div>
              <Button onClick={() => { setSelectedPlan(plan); setShowPayment(true); }} className="w-full bg-primary hover:bg-primary/90 text-white">
                Купить
              </Button>
            </Card>
          ))}
        </div>
      </section>

      <Dialog open={showRegister} onOpenChange={setShowRegister}>
        <DialogContent className="bg-gradient-to-br from-black/95 to-black/80 backdrop-blur-2xl border border-secondary/30">
          <DialogHeader>
            <DialogTitle className="text-2xl font-montserrat text-white">Регистрация</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white/70">Email</Label>
              <Input value={registerForm.email} onChange={e => setRegisterForm({...registerForm, email: e.target.value})} className="bg-white/5 border-white/20 text-white" placeholder="your@email.com" />
            </div>
            <div>
              <Label className="text-white/70">Логин</Label>
              <Input value={registerForm.username} onChange={e => setRegisterForm({...registerForm, username: e.target.value})} className="bg-white/5 border-white/20 text-white" placeholder="username" />
            </div>
            <div>
              <Label className="text-white/70">Пароль</Label>
              <Input type="password" value={registerForm.password} onChange={e => setRegisterForm({...registerForm, password: e.target.value})} className="bg-white/5 border-white/20 text-white" placeholder="••••••••" />
            </div>
            <Button onClick={handleRegister} className="w-full bg-primary hover:bg-primary/90 text-white">Зарегистрироваться</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent className="bg-gradient-to-br from-black/95 to-black/80 backdrop-blur-2xl border border-secondary/30">
          <DialogHeader>
            <DialogTitle className="text-2xl font-montserrat text-white">Вход</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white/70">Логин</Label>
              <Input value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} className="bg-white/5 border-white/20 text-white" placeholder="username" />
            </div>
            <div>
              <Label className="text-white/70">Пароль</Label>
              <Input type="password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="bg-white/5 border-white/20 text-white" placeholder="••••••••" />
            </div>
            <Button onClick={handleLogin} className="w-full bg-primary hover:bg-primary/90 text-white">Войти</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="bg-gradient-to-br from-black/95 to-black/80 backdrop-blur-2xl border border-secondary/30 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-montserrat text-white">Выберите способ оплаты</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {selectedPlan && (
              <div className="bg-white/5 rounded-lg p-6 border border-secondary/30">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-white/70 text-sm">Тариф</p>
                    <p className="text-white text-xl font-montserrat font-bold">{selectedPlan.name}</p>
                  </div>
                  <div className="text-right">
                    {discount > 0 && (
                      <p className="text-white/50 line-through text-sm">{selectedPlan.price}₽</p>
                    )}
                    <p className="text-primary text-3xl font-bold">{finalPrice}₽</p>
                    {discount > 0 && (
                      <p className="text-secondary text-sm">-{discount * 100}%</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <Label className="text-white/70 mb-2 block">Промокод (если есть)</Label>
              <Input value={promoCode} onChange={e => setPromoCode(e.target.value)} className="bg-white/5 border-white/20 text-white" placeholder="Release или Delaros" />
            </div>

            <div>
              <Label className="text-white text-lg mb-3 block">Выберите способ оплаты</Label>
              <div className="grid grid-cols-2 gap-4">
                {PAYMENT_METHODS.map((method, idx) => (
                  <Button 
                    key={idx} 
                    onClick={() => handleSelectPayment(method)} 
                    variant="outline" 
                    className={`h-16 text-lg border-secondary/50 hover:bg-secondary hover:text-black text-white transition-all ${selectedPayment?.id === method.id ? 'bg-secondary text-black border-secondary' : ''}`}
                  >
                    {method.name}
                  </Button>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleFinalPayment} 
              disabled={!selectedPayment} 
              className="w-full bg-primary hover:bg-primary/90 text-white h-14 text-lg font-semibold"
            >
              Оплатить {finalPrice}₽
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="bg-gradient-to-br from-black/95 to-black/80 backdrop-blur-2xl border border-secondary/30">
          <DialogHeader>
            <DialogTitle className="text-2xl font-montserrat text-white">Личный кабинет</DialogTitle>
          </DialogHeader>
          {user && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <Label className="text-white/50 text-sm">UID</Label>
                <p className="text-white font-mono">{user.uid}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <Label className="text-white/50 text-sm">Login</Label>
                <p className="text-white">{user.username}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <Label className="text-white/50 text-sm">Email</Label>
                <p className="text-white">{user.email}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex justify-between items-center">
                  <div>
                    <Label className="text-white/50 text-sm">Password</Label>
                    <p className="text-white font-mono">{showPassword ? '********' : '••••••••'}</p>
                  </div>
                  <Button onClick={() => setShowPassword(!showPassword)} variant="ghost" size="sm" className="text-secondary">
                    {showPassword ? 'Скрыть' : 'Показать'}
                  </Button>
                </div>
              </div>
              {user.subscription && (
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <Label className="text-white/50 text-sm">Подписка действительна до</Label>
                  <p className="text-secondary font-semibold">
                    {user.subscription.expiresAt ? new Date(user.subscription.expiresAt).toLocaleDateString() : 'Навсегда'}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <footer className="py-12 px-6 border-t border-white/10 text-center text-white/50">
        <p className="font-roboto">© 2024 AstrixClient. Все права защищены.</p>
      </footer>
    </div>
  );
}