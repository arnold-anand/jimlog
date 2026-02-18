'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Dumbbell, BarChart, Utensils, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        { href: '/dashboard', label: 'Home', icon: Home },
        { href: '/routines', label: 'Workout', icon: Dumbbell },
        { href: '/stats', label: 'Stats', icon: BarChart },
        { href: '/nutrition', label: 'Food', icon: Utensils },
        { href: '/profile', label: 'Profile', icon: User },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex flex-col items-center justify-center w-full h-full text-xs font-medium transition-colors',
                                isActive ? 'text-orange-500' : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <item.icon className="h-6 w-6 mb-1" />
                            {item.label}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
