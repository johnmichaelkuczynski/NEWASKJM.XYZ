import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Copy, Trash2, FileText, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DragDropUpload } from "@/components/ui/drag-drop-upload";

interface PhilosophicalFictionSectionProps {
  onRegisterInput?: (setter: (content: string) => void) => void;
  onRegisterOutputs?: (outputGetters: Record<string, () => string>) => void;
  onTransfer?: (content: string, target: 'chat' | 'model' | 'paper' | 'thesis' | 'nightmare' | 'fiction') => void;
}

// Phase 1 authors from Author Literature Organization System
const AVAILABLE_AUTHORS = [
  { id: 'kuczynski', name: 'J.-M. Kuczynski', description: 'Analytic precision & rigorous logic' },
  { id: 'freud', name: 'Sigmund Freud', description: 'Psychoanalytic depth & unconscious mechanisms' },
  { id: 'berkeley', name: 'George Berkeley', description: 'Idealist metaphysics & esse est percipi' },
  { id: 'james', name: 'William James', description: 'Pragmatic flexibility & radical empiricism' },
  { id: 'nietzsche', name: 'Friedrich Nietzsche', description: 'Genealogical attack & hammer-blow rhetoric' },
  { id: 'marx', name: 'Karl Marx', description: 'Dialectical materialism & class analysis' },
  { id: 'dostoevsky', name: 'Fyodor Dostoevsky', description: 'Psychological realism & Russian soul' },
  { id: 'plato', name: 'Plato', description: 'Dialogical philosophy & Theory of Forms' },
];

export function PhilosophicalFictionSection({ 
  onRegisterInput, 
  onRegisterOutputs,
  onTransfer 
}: PhilosophicalFictionSectionProps) {
  const [mode, setMode] = useState<'paste' | 'upload'>('paste');
  const [inputText, setInputText] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileSize, setUploadedFileSize] = useState(0);
  const [generatedFiction, setGeneratedFiction] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (onRegisterInput) {
      onRegisterInput((content: string) => setInputText(content));
    }
  }, [onRegisterInput]);

  useEffect(() => {
    if (onRegisterOutputs) {
      onRegisterOutputs({
        fiction: () => generatedFiction,
      });
    }
  }, [onRegisterOutputs, generatedFiction]);

  const handleFileAccepted = (file: File) => {
    setSelectedFile(file);
    setUploadedFileName(file.name);
    setUploadedFileSize(file.size);
    toast({
      title: "File selected",
      description: file.name,
    });
  };

  const handleValidationError = (error: { title: string; description: string }) => {
    toast({
      title: error.title,
      description: error.description,
      variant: "destructive",
    });
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setUploadedFileName('');
    setUploadedFileSize(0);
  };

  const handleGenerate = async () => {
    if (mode === 'paste' && !inputText.trim()) {
      toast({
        title: "Missing input",
        description: "Please paste source text to transform into fiction.",
        variant: "destructive",
      });
      return;
    }

    if (mode === 'upload' && !selectedFile) {
      toast({
        title: "No file selected",
        description: "Please upload a file containing source text.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedAuthor) {
      toast({
        title: "No author selected",
        description: "Please select a philosopher to write in their voice.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedFiction('');
    setWordCount(0);

    try {
      const formData = new FormData();
      
      if (mode === 'upload' && selectedFile) {
        formData.append('file', selectedFile);
      } else {
        formData.append('text', inputText);
      }

      formData.append('authorId', selectedAuthor);
      
      if (customInstructions.trim()) {
        formData.append('customInstructions', customInstructions);
      }

      const response = await fetch('/api/philosophical-fiction', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      let accumulatedText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            
            if (data === "[DONE]") {
              setIsGenerating(false);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.content) {
                accumulatedText += parsed.content;
                setGeneratedFiction(accumulatedText);
              }
              
              if (parsed.done && parsed.wordCount) {
                setWordCount(parsed.wordCount);
                toast({
                  title: "Fiction generated",
                  description: `Created ${parsed.wordCount}-word story in ${AVAILABLE_AUTHORS.find(a => a.id === selectedAuthor)?.name}'s voice`,
                });
              }
              
              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (err) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }

    } catch (error) {
      console.error("Philosophical fiction generation error:", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate fiction",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClear = () => {
    setInputText('');
    setSelectedFile(null);
    setUploadedFileName('');
    setUploadedFileSize(0);
    setGeneratedFiction('');
    setWordCount(0);
    setSelectedAuthor('');
    setCustomInstructions('');
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Fiction copied successfully",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full" id="philosophical-fiction-section">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Philosophical Fiction Writer
        </CardTitle>
        <CardDescription>
          Transform non-fiction text into narrative fiction written in a philosopher's distinctive voice
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Section */}
        <div className="space-y-4">
          <Label htmlFor="fiction-input">Source Text</Label>
          
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'paste' | 'upload')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="paste" data-testid="tab-paste-fiction">Paste Text</TabsTrigger>
              <TabsTrigger value="upload" data-testid="tab-upload-fiction">Upload File</TabsTrigger>
            </TabsList>

            <TabsContent value="paste" className="space-y-4">
              <Textarea
                ref={textareaRef}
                id="fiction-input"
                placeholder="Paste non-fiction text here (thesis, argument, philosophical concept)... Will be transformed into narrative fiction."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={6}
                className="resize-y font-mono text-sm"
                data-testid="textarea-fiction-input"
              />
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <DragDropUpload
                accept=".txt,.pdf,.doc,.docx"
                maxSizeBytes={5 * 1024 * 1024}
                onFileAccepted={handleFileAccepted}
                onValidationError={handleValidationError}
                onClear={handleClearFile}
                currentFileName={uploadedFileName}
                currentFileSize={uploadedFileSize}
                data-testid="drag-drop-upload-fiction"
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Author Selection */}
        <div className="space-y-2">
          <Label htmlFor="author-select">Philosopher's Voice</Label>
          <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
            <SelectTrigger id="author-select" data-testid="select-author">
              <SelectValue placeholder="Select philosopher..." />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_AUTHORS.map((author) => (
                <SelectItem key={author.id} value={author.id} data-testid={`author-${author.id}`}>
                  <div>
                    <div className="font-medium">{author.name}</div>
                    <div className="text-xs text-muted-foreground">{author.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Custom Instructions (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="custom-instructions">Custom Instructions (Optional)</Label>
          <Textarea
            id="custom-instructions"
            placeholder="Any specific requirements for the fiction? (e.g., 'Include dialogue', 'First-person perspective', 'Focus on psychological depth')..."
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            rows={3}
            className="resize-y text-sm"
            data-testid="textarea-custom-instructions"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex-1"
            data-testid="button-generate-fiction"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Fiction...
              </>
            ) : (
              'Generate Fiction'
            )}
          </Button>
          <Button 
            onClick={handleClear} 
            variant="outline"
            disabled={isGenerating}
            data-testid="button-clear-fiction"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Output Section */}
        {generatedFiction && (
          <div className="space-y-3 border-t pt-6">
            <div className="flex items-center justify-between">
              <Label>Generated Fiction</Label>
              <div className="flex items-center gap-2">
                {wordCount > 0 && (
                  <span className="text-sm text-muted-foreground" data-testid="text-word-count">
                    {wordCount} words
                  </span>
                )}
                {onTransfer && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" data-testid="button-send-to">
                        Send to <ChevronDown className="ml-1 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onTransfer(generatedFiction, 'chat')} data-testid="send-to-chat">
                        Chat
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onTransfer(generatedFiction, 'model')} data-testid="send-to-model">
                        Model Builder
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onTransfer(generatedFiction, 'thesis')} data-testid="send-to-thesis">
                        Thesis to World
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onTransfer(generatedFiction, 'nightmare')} data-testid="send-to-nightmare">
                        Nightmare Conversion
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Button 
                  onClick={() => handleCopy(generatedFiction)} 
                  variant="outline" 
                  size="sm"
                  data-testid="button-copy-fiction"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div 
              className="prose dark:prose-invert max-w-none p-4 rounded-md bg-muted/50 whitespace-pre-wrap"
              data-testid="output-fiction"
            >
              {generatedFiction}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
