import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen bg-background pb-16">
            <Header />
            <main className="flex-1 container mx-auto p-4">{children}</main>
            <BottomNav />
        </div>
    );
}
