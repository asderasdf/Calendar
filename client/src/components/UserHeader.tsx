import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import { User, LogOut, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const UserHeader = () => {
  const { user, logoutMutation, isAdmin } = useAuth();
  const [, navigate] = useLocation();

  if (!user) return null;

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate("/auth");
      }
    });
  };

  const handleAdminPanel = () => {
    navigate("/admin");
  };

  return (
    <header className="bg-white shadow-sm py-3 px-4 mb-4">
      <div className="container mx-auto flex flex-col">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-bold text-primary">تقويم أم القرى</h1>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{user.name}</span>
                <Badge variant="secondary" className="mr-2 bg-green-100 text-green-800 text-xs">
                  تم الدخول
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>حسابي</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isAdmin && (
                <DropdownMenuItem onClick={handleAdminPanel}>
                  <Settings className="h-4 w-4 ml-2" />
                  <span>لوحة الإدارة</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4 ml-2" />
                <span>تسجيل الخروج</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default UserHeader;
