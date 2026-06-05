import { QrCode } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4" dir="rtl">
      <div className="text-center">
        <div className="w-20 h-20 bg-accent rounded-3xl flex items-center justify-center mx-auto mb-6">
          <QrCode className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-6xl font-black text-primary mb-4">404</h1>
        <p className="text-xl font-bold text-foreground mb-2">الصفحة غير موجودة</p>
        <p className="text-muted-foreground mb-8">الصفحة التي تبحث عنها غير موجودة أو تم نقلها.</p>
        <a
          href="/"
          className="bg-primary text-white font-bold px-8 py-3 rounded-xl hover:brightness-110 transition-all inline-block"
        >
          العودة للرئيسية
        </a>
      </div>
    </div>
  );
}
