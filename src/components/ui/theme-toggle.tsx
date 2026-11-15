import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/shared/theme/theme";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === "dark";

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className="rounded-full hover:bg-primary/10"
      aria-label={isDark ? t("header.switchToLight") : t("header.switchToDark")}
      title={isDark ? t("header.switchToLight") : t("header.switchToDark")}
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-primary" />
      ) : (
        <Moon className="h-5 w-5 text-primary" />
      )}
    </Button>
  );
};
