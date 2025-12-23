import { Button } from '@/components/ui/button';
import { GlassWater, Beaker, Crown, RefreshCw, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Tab = 'cocktails' | 'ingredients' | 'my-area' | 'admin';

interface NavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  isAdmin: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function Navigation({
  activeTab,
  onTabChange,
  isAdmin,
  isRefreshing,
  onRefresh,
}: NavigationProps) {
  const tabs = [
    { id: 'cocktails' as Tab, icon: GlassWater, label: 'Cocktails' },
    { id: 'ingredients' as Tab, icon: Beaker, label: 'Ingredients' },
    { id: 'my-area' as Tab, icon: UserRound, label: 'My area' },
    ...(isAdmin ? [{ id: 'admin' as Tab, icon: Crown, label: 'Admin' }] : []),
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-pb">
      <div className="flex items-center justify-around max-w-lg mx-auto px-2 py-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all",
              activeTab === tab.id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className={cn(
              "w-5 h-5 transition-transform",
              activeTab === tab.id && "scale-110"
            )} />
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
          <span className="text-xs font-medium">Refresh</span>
        </button>
      </div>
    </nav>
  );
}
