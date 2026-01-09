import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Plus, X, Dices, Shuffle, Skull } from "lucide-react";

const Roulette = () => {
  const { profile, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const [items, setItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  
  // Random number generator
  const [maxNumber, setMaxNumber] = useState("");
  const [randomResult, setRandomResult] = useState<number | null>(null);

  const wheelRef = useRef<HTMLDivElement>(null);

  const hasRouletteAccess = profile?.role === "admin" || profile?.role === "developer" || (profile as any)?.custom_role?.has_roulette_access;

  useEffect(() => {
    if (!isLoading && !hasRouletteAccess) {
      navigate("/");
    }
  }, [profile, isLoading, navigate, hasRouletteAccess]);

  const addItem = () => {
    if (newItem.trim() && !items.includes(newItem.trim())) {
      setItems([...items, newItem.trim()]);
      setNewItem("");
    }
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const spinWheel = () => {
    if (items.length < 2) return;
    
    setIsSpinning(true);
    setWinner(null);
    
    // Random number of full rotations (5-10) plus random position
    const randomIndex = Math.floor(Math.random() * items.length);
    const segmentAngle = 360 / items.length;
    const targetRotation = rotation + 1800 + (360 - (randomIndex * segmentAngle) - segmentAngle / 2);
    
    setRotation(targetRotation);
    
    setTimeout(() => {
      setIsSpinning(false);
      setWinner(items[randomIndex]);
    }, 5000);
  };

  const generateRandomNumber = () => {
    const max = parseInt(maxNumber);
    if (max > 0) {
      setRandomResult(Math.floor(Math.random() * max) + 1);
    }
  };

  const getSegmentColor = (index: number) => {
    const colors = [
      'hsl(0, 72%, 45%)',
      'hsl(0, 72%, 35%)',
      'hsl(0, 72%, 55%)',
      'hsl(0, 72%, 40%)',
      'hsl(0, 72%, 50%)',
      'hsl(0, 72%, 30%)',
    ];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </div>
      </Layout>
    );
  }

  if (!hasRouletteAccess) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <Dices className="w-12 h-12 mx-auto text-primary mb-4" />
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Рулетка Blood Residence
          </h1>
          <p className="text-muted-foreground">
            Рандомайзер для розіграшів
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Wheel */}
          <div className="lg:col-span-2 flex flex-col items-center">
            <div className="relative">
              {/* Pointer */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[30px] border-l-transparent border-r-transparent border-t-primary drop-shadow-lg" />
              </div>
              
              {/* Wheel */}
              <div 
                ref={wheelRef}
                className="relative w-80 h-80 md:w-96 md:h-96 rounded-full border-8 border-primary shadow-2xl overflow-hidden"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: isSpinning ? 'transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                }}
              >
                {items.length === 0 ? (
                  <div className="w-full h-full bg-secondary flex items-center justify-center">
                    <div className="text-center p-4">
                      <Skull className="w-16 h-16 mx-auto text-primary mb-4" />
                      <p className="text-muted-foreground">Додайте учасників</p>
                    </div>
                  </div>
                ) : (
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    {items.map((item, index) => {
                      const segmentAngle = 360 / items.length;
                      const startAngle = index * segmentAngle - 90;
                      const endAngle = startAngle + segmentAngle;
                      
                      const startRad = (startAngle * Math.PI) / 180;
                      const endRad = (endAngle * Math.PI) / 180;
                      
                      const x1 = 100 + 100 * Math.cos(startRad);
                      const y1 = 100 + 100 * Math.sin(startRad);
                      const x2 = 100 + 100 * Math.cos(endRad);
                      const y2 = 100 + 100 * Math.sin(endRad);
                      
                      const largeArc = segmentAngle > 180 ? 1 : 0;
                      
                      const midAngle = (startAngle + endAngle) / 2;
                      const midRad = (midAngle * Math.PI) / 180;
                      const textX = 100 + 60 * Math.cos(midRad);
                      const textY = 100 + 60 * Math.sin(midRad);
                      
                      return (
                        <g key={index}>
                          <path
                            d={`M 100 100 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z`}
                            fill={getSegmentColor(index)}
                            stroke="hsl(0, 0%, 10%)"
                            strokeWidth="1"
                          />
                          <text
                            x={textX}
                            y={textY}
                            fill="white"
                            fontSize="8"
                            fontWeight="bold"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
                          >
                            {item.length > 10 ? item.substring(0, 10) + '...' : item}
                          </text>
                        </g>
                      );
                    })}
                    <circle cx="100" cy="100" r="15" fill="hsl(0, 0%, 10%)" />
                    <Skull className="absolute" />
                  </svg>
                )}
              </div>
            </div>

            {winner && (
              <div className="mt-8 text-center animate-fade-up">
                <p className="text-lg text-muted-foreground mb-2">Переможець:</p>
                <p className="font-display text-3xl font-bold text-gradient-blood">{winner}</p>
              </div>
            )}

            <Button
              onClick={spinWheel}
              disabled={isSpinning || items.length < 2}
              className="mt-8 btn-blood rounded-xl text-lg px-10 py-6"
            >
              {isSpinning ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Shuffle className="w-5 h-5 mr-2" />
              )}
              {isSpinning ? "Крутиться..." : "Крутити!"}
            </Button>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Add items */}
            <div className="card-blood p-6">
              <h3 className="font-display text-lg font-semibold mb-4">Учасники</h3>
              <div className="flex gap-2 mb-4">
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addItem()}
                  placeholder="Додати учасника..."
                  className="bg-secondary"
                />
                <Button onClick={addItem} className="btn-blood">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-secondary/50 rounded-lg"
                  >
                    <span className="truncate">{item}</span>
                    <button
                      onClick={() => removeItem(index)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              {items.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setItems([])}
                  className="w-full mt-4"
                >
                  Очистити все
                </Button>
              )}
            </div>

            {/* Random Number Generator */}
            <div className="card-blood p-6">
              <h3 className="font-display text-lg font-semibold mb-4">Рандомайзер чисел</h3>
              <div className="flex gap-2 mb-4">
                <Input
                  type="number"
                  value={maxNumber}
                  onChange={(e) => setMaxNumber(e.target.value)}
                  placeholder="Максимум (напр. 30)"
                  className="bg-secondary"
                  min="1"
                />
                <Button onClick={generateRandomNumber} className="btn-blood">
                  <Dices className="w-4 h-4" />
                </Button>
              </div>
              
              {randomResult !== null && (
                <div className="text-center p-4 bg-secondary/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Результат:</p>
                  <p className="font-display text-4xl font-bold text-primary">{randomResult}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Roulette;