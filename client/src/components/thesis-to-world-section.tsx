import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Copy, Trash2, FileText, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DragDropUpload } from "@/components/ui/drag-drop-upload";

interface ThesisToWorldSectionProps {
  onRegisterInput?: (setter: (content: string) => void) => void;
}

export function ThesisToWorldSection({ onRegisterInput }: ThesisToWorldSectionProps) {
  const [mode, setMode] = useState<'paste' | 'upload'>('paste');
  const [inputText, setInputText] = useState('');
  const [customization, setCustomization] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [storyToModelAround, setStoryToModelAround] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileSize, setUploadedFileSize] = useState(0);
  const [generatedFiction, setGeneratedFiction] = useState('');
  const [extractedThesis, setExtractedThesis] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Register input setter for external content transfer
  useEffect(() => {
    if (onRegisterInput) {
      onRegisterInput((content: string) => setInputText(content));
    }
  }, [onRegisterInput]);

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
        description: "Please paste non-fiction text containing a thesis about human nature.",
        variant: "destructive",
      });
      return;
    }

    if (mode === 'upload' && !selectedFile) {
      toast({
        title: "No file selected",
        description: "Please upload a file containing non-fiction text.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedFiction('');
    setExtractedThesis('');
    setWordCount(0);

    try {
      const formData = new FormData();
      
      if (mode === 'upload' && selectedFile) {
        formData.append('file', selectedFile);
      } else {
        formData.append('text', inputText);
      }

      if (customization.trim()) {
        formData.append('customization', customization.trim());
      }
      if (customInstructions.trim()) {
        formData.append('customInstructions', customInstructions);
      }
      if (storyToModelAround.trim()) {
        formData.append('storyToModelAround', storyToModelAround);
      }

      const response = await fetch('/api/thesis-to-world', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      setExtractedThesis(data.thesis);
      setGeneratedFiction(data.fiction);
      setWordCount(data.wordCount);

      toast({
        title: "Fiction generated",
        description: `Created ${data.wordCount}-word documentary-style fiction`,
      });

    } catch (error) {
      console.error("Thesis to World error:", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate fiction",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedFiction) return;

    try {
      await navigator.clipboard.writeText(generatedFiction);
      toast({
        title: "Copied to clipboard",
        description: "Fiction has been copied successfully",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDelete = () => {
    setGeneratedFiction('');
    setExtractedThesis('');
    setWordCount(0);
    toast({
      title: "Output cleared",
      description: "Generated fiction has been deleted",
    });
  };

  return (
    <section id="thesis-to-world" className="scroll-mt-6">
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            <CardTitle>Thesis to World</CardTitle>
          </div>
          <CardDescription>
            Convert non-fiction claims about human nature into documentary-style fiction depicting a world where the thesis is true
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'paste' | 'upload')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="paste" data-testid="tab-paste-text">
                Paste Text
              </TabsTrigger>
              <TabsTrigger value="upload" data-testid="tab-upload-file">
                Upload File
              </TabsTrigger>
            </TabsList>

            <TabsContent value="paste" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="input-text">
                  Paste or upload non-fiction text containing a thesis about human nature
                </Label>
                <Textarea
                  id="input-text"
                  data-testid="textarea-input-text"
                  ref={textareaRef}
                  placeholder="e.g., 'Research shows that people are fundamentally selfish and prioritize personal gain over collective good when resources are scarce...'"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={8}
                  className="resize-y"
                />
              </div>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <div className="space-y-2">
                <Label>Upload non-fiction document (.txt, .pdf, .doc, .docx)</Label>
                <DragDropUpload
                  accept=".txt,.pdf,.doc,.docx"
                  maxSizeBytes={5 * 1024 * 1024}
                  onFileAccepted={handleFileAccepted}
                  onValidationError={handleValidationError}
                  onClear={handleClearFile}
                  currentFileName={uploadedFileName}
                  currentFileSize={uploadedFileSize}
                  data-testid="drag-drop-upload-thesis"
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="customization">
              Customize fiction details (optional)
            </Label>
            <Input
              id="customization"
              data-testid="input-customization"
              placeholder="e.g., 'Make it about a soccer player named Bart who lives in Lisbon'"
              value={customization}
              onChange={(e) => setCustomization(e.target.value)}
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
            data-testid="button-generate-fiction"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Fiction...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate Fiction
              </>
            )}
          </Button>

          {extractedThesis && (
            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
              <Label className="text-sm font-semibold">Extracted Thesis:</Label>
              <p className="text-sm italic" data-testid="text-extracted-thesis">
                "{extractedThesis}"
              </p>
            </div>
          )}

          {generatedFiction && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-semibold">
                  Generated Fiction ({wordCount} words)
                </Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    data-testid="button-copy-fiction"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    data-testid="button-delete-fiction"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
              <div
                className="p-4 bg-card border rounded-md whitespace-pre-wrap font-serif text-sm leading-relaxed"
                data-testid="text-generated-fiction"
              >
                {generatedFiction}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
