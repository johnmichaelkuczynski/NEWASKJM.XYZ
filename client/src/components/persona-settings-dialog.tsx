import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { PersonaSettings } from "@shared/schema";

interface PersonaSettingsDialogProps {
  settings: PersonaSettings;
  onSave: (settings: Partial<PersonaSettings>) => void;
  isLoading?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function PersonaSettingsDialog({
  settings,
  onSave,
  isLoading,
  open: controlledOpen,
  onOpenChange,
}: PersonaSettingsDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onSave(localSettings);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" data-testid="button-settings">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Customize Your Spiritual Guide
          </DialogTitle>
          <DialogDescription>
            Control intelligence, tone, gender, and speaking style. Changes affect all future responses.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-4">
          {/* AI Model Selection */}
          <div className="space-y-3">
            <Label htmlFor="selected-model" className="text-base font-medium">
              AI Model
            </Label>
            <p className="text-xs text-muted-foreground">
              Select which intelligence powers your philosophical responses
            </p>
            <Select
              value={localSettings.selectedModel || "zhi5"}
              onValueChange={(value) =>
                setLocalSettings({ ...localSettings, selectedModel: value })
              }
            >
              <SelectTrigger id="selected-model" data-testid="select-model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zhi5">ZHI 5 - Real-time, witty, direct (default)</SelectItem>
                <SelectItem value="zhi1">ZHI 1 - Fast, versatile, creative</SelectItem>
                <SelectItem value="zhi2">ZHI 2 - Most sophisticated, nuanced reasoning</SelectItem>
                <SelectItem value="zhi3">ZHI 3 - Economical, efficient</SelectItem>
                <SelectItem value="zhi4">ZHI 4 - Research-augmented, fact-checked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Spiritual Voice Type */}
          <div className="space-y-3">
            <Label htmlFor="voice-type" className="text-base font-medium">
              Spiritual Voice Type
            </Label>
            <p className="text-xs text-muted-foreground">
              Choose the personality style of your spiritual guide
            </p>
            <Select
              value={localSettings.voiceType}
              onValueChange={(value) =>
                setLocalSettings({ ...localSettings, voiceType: value })
              }
            >
              <SelectTrigger id="voice-type" data-testid="select-voice-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gentle">Gentle Shepherd - Soft, nurturing, compassionate</SelectItem>
                <SelectItem value="tough">Tough Love - Firm, challenging, direct truth</SelectItem>
                <SelectItem value="scholar">Scholar - Learned, theological, intellectual</SelectItem>
                <SelectItem value="therapist">Therapist - Empathetic, listening, supportive</SelectItem>
                <SelectItem value="plainspoken">Plainspoken - Simple, straightforward, clear</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Intelligence Level */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-base font-medium">Intelligence & Depth</Label>
              <span className="text-sm font-semibold text-sacred-gold" data-testid="text-intelligence-value">
                {localSettings.intelligenceLevel}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              1 = Simple everyday language  •  10 = Deep theological concepts
            </p>
            <div className="space-y-2">
              <Slider
                value={[localSettings.intelligenceLevel]}
                onValueChange={(value) =>
                  setLocalSettings({ ...localSettings, intelligenceLevel: value[0] })
                }
                min={1}
                max={10}
                step={1}
                data-testid="slider-intelligence"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Grade School</span>
                <span>Seminary Scholar</span>
              </div>
            </div>
          </div>

          {/* Emotional Tone */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-base font-medium">Emotional Warmth</Label>
              <span className="text-sm font-semibold text-sacred-gold" data-testid="text-emotional-value">
                {localSettings.emotionalTone}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              1 = Rational and detached  •  10 = Deeply compassionate and warm
            </p>
            <div className="space-y-2">
              <Slider
                value={[localSettings.emotionalTone]}
                onValueChange={(value) =>
                  setLocalSettings({ ...localSettings, emotionalTone: value[0] })
                }
                min={1}
                max={10}
                step={1}
                data-testid="slider-emotional"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Stoic Teacher</span>
                <span>Loving Parent</span>
              </div>
            </div>
          </div>

          {/* Voice Gender */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Voice Gender & Energy</Label>
            <p className="text-xs text-muted-foreground">
              Affects the spiritual presence and language style
            </p>
            <RadioGroup
              value={localSettings.voiceGender}
              onValueChange={(value) =>
                setLocalSettings({ ...localSettings, voiceGender: value })
              }
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="masculine" id="masculine" data-testid="radio-masculine" />
                <Label htmlFor="masculine" className="font-normal cursor-pointer">
                  Masculine
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="feminine" id="feminine" data-testid="radio-feminine" />
                <Label htmlFor="feminine" className="font-normal cursor-pointer">
                  Feminine
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="neutral" id="neutral" data-testid="radio-neutral" />
                <Label htmlFor="neutral" className="font-normal cursor-pointer">
                  Neutral
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Formality */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Language Style</Label>
            <p className="text-xs text-muted-foreground">
              Controls whether responses use modern or biblical language
            </p>
            <RadioGroup
              value={localSettings.formality}
              onValueChange={(value) =>
                setLocalSettings({ ...localSettings, formality: value })
              }
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="casual" id="casual" data-testid="radio-casual" />
                <Label htmlFor="casual" className="font-normal cursor-pointer">
                  Casual
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="neutral" id="neutral-form" data-testid="radio-neutral-formality" />
                <Label htmlFor="neutral-form" className="font-normal cursor-pointer">
                  Neutral
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="biblical" id="biblical" data-testid="radio-biblical" />
                <Label htmlFor="biblical" className="font-normal cursor-pointer">
                  Biblical
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            data-testid="button-cancel-settings"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            data-testid="button-save-settings"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
