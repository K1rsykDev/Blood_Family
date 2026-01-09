import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";

interface GlowColorPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (startColor: string, endColor: string) => void;
  username: string;
}

const presetColors = [
  { name: "Червоний", value: "#dc2626" },
  { name: "Помаранчевий", value: "#ea580c" },
  { name: "Жовтий", value: "#eab308" },
  { name: "Зелений", value: "#22c55e" },
  { name: "Бірюзовий", value: "#14b8a6" },
  { name: "Синій", value: "#3b82f6" },
  { name: "Фіолетовий", value: "#8b5cf6" },
  { name: "Рожевий", value: "#ec4899" },
  { name: "Білий", value: "#ffffff" },
  { name: "Золотий", value: "#fbbf24" },
];

export const GlowColorPicker = ({
  open,
  onOpenChange,
  onConfirm,
  username,
}: GlowColorPickerProps) => {
  const [startColor, setStartColor] = useState("#dc2626");
  const [endColor, setEndColor] = useState("#ea580c");

  const handleConfirm = () => {
    onConfirm(startColor, endColor);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            Вибір кольорів підсвічування
          </DialogTitle>
          <DialogDescription>
            Виберіть кольори для градієнтного підсвічування вашого нікнейму
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Preview */}
          <div className="text-center p-6 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Попередній перегляд:</p>
            <span
              className="text-2xl font-bold nickname-gradient-glow"
              data-text={username}
              style={{
                background: `linear-gradient(90deg, ${startColor}, ${endColor})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                "--glow-color-start": startColor,
                "--glow-color-end": endColor,
              } as React.CSSProperties}
            >
              {username}
            </span>
          </div>

          {/* Color pickers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Початковий колір</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={startColor}
                  onChange={(e) => setStartColor(e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={startColor}
                  onChange={(e) => setStartColor(e.target.value)}
                  className="flex-1 font-mono text-sm"
                  placeholder="#dc2626"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Кінцевий колір</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={endColor}
                  onChange={(e) => setEndColor(e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={endColor}
                  onChange={(e) => setEndColor(e.target.value)}
                  className="flex-1 font-mono text-sm"
                  placeholder="#ea580c"
                />
              </div>
            </div>
          </div>

          {/* Preset colors */}
          <div className="space-y-2">
            <Label>Швидкий вибір кольорів</Label>
            <div className="grid grid-cols-5 gap-2">
              {presetColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setStartColor(color.value)}
                  className="w-full aspect-square rounded-lg border-2 border-border hover:border-primary transition-colors relative group"
                  style={{ backgroundColor: color.value }}
                  title={`${color.name} (початковий)`}
                >
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    1
                  </span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-2 mt-1">
              {presetColors.map((color) => (
                <button
                  key={color.value + "-end"}
                  onClick={() => setEndColor(color.value)}
                  className="w-full aspect-square rounded-lg border-2 border-border hover:border-primary transition-colors relative group"
                  style={{ backgroundColor: color.value }}
                  title={`${color.name} (кінцевий)`}
                >
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    2
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              Верхній ряд — початковий колір, нижній ряд — кінцевий колір
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Скасувати
          </Button>
          <Button onClick={handleConfirm} className="btn-blood">
            Підтвердити покупку
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
