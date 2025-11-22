import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Copy, Trash2, FileText, ChevronDown, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DragDropUpload } from "@/components/ui/drag-drop-upload";

interface NightmareConversionSectionProps {
  onRegisterInput?: (setter: (content: string) => void) => void;
  onRegisterOutputs?: (outputGetters: Record<string, () => string>) => void;
}

export function NightmareConversionSection({ onRegisterInput, onRegisterOutputs }: NightmareConversionSectionProps) {
  const [mode, setMode] = useState<'paste' | 'upload'>('paste');
  const [inputText, setInputText] = useState('');
  const [genderPreference, setGenderPreference] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileSize, setUploadedFileSize] = useState(0);
  const [generatedNightmare, setGeneratedNightmare] = useState('');
  const [extractedAnxiety, setExtractedAnxiety] = useState('');
  const [templateSelection, setTemplateSelection] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [initialCustomInstructions, setInitialCustomInstructions] = useState('');
  const [initialStoryModel, setInitialStoryModel] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewrittenNightmare, setRewrittenNightmare] = useState('');
  const [rewrittenTemplate, setRewrittenTemplate] = useState('');
  const [rewrittenWordCount, setRewrittenWordCount] = useState(0);
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
        nightmare: () => generatedNightmare,
        anxiety: () => extractedAnxiety
      });
    }
  }, [onRegisterOutputs, generatedNightmare, extractedAnxiety]);

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
        description: "Please paste non-fiction text to analyze.",
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
    setGeneratedNightmare('');
    setExtractedAnxiety('');
    setWordCount(0);

    try {
      const formData = new FormData();
      
      if (mode === 'upload' && selectedFile) {
        formData.append('file', selectedFile);
      } else {
        formData.append('text', inputText);
      }

      if (genderPreference) {
        formData.append('genderPreference', genderPreference);
      }
      if (initialCustomInstructions.trim()) {
        formData.append('customInstructions', initialCustomInstructions);
      }
      if (initialStoryModel.trim()) {
        formData.append('storyToModelAround', initialStoryModel);
      }

      const response = await fetch('/api/nightmare-conversion', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      setExtractedAnxiety(data.anxiety);
      setTemplateSelection(data.templateSelection || '');
      setGeneratedNightmare(data.nightmare);
      setWordCount(data.wordCount);
      setRewrittenNightmare('');
      setRewrittenTemplate('');
      setCustomInstructions('');

      toast({
        title: "Nightmare generated",
        description: `Created ${data.wordCount}-word story`,
      });

    } catch (error) {
      console.error("Nightmare conversion error:", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate nightmare",
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
    setGeneratedNightmare('');
    setExtractedAnxiety('');
    setTemplateSelection('');
    setWordCount(0);
    setGenderPreference('');
    setInitialCustomInstructions('');
    setInitialStoryModel('');
    setCustomInstructions('');
    setRewrittenNightmare('');
    setRewrittenTemplate('');
    setRewrittenWordCount(0);
  };

  const handleRewrite = async () => {
    if (!customInstructions.trim()) {
      toast({
        title: "Missing instructions",
        description: "Please provide custom instructions for the rewrite.",
        variant: "destructive",
      });
      return;
    }

    if (!extractedAnxiety) {
      toast({
        title: "No story to rewrite",
        description: "Please generate a story first before rewriting.",
        variant: "destructive",
      });
      return;
    }

    setIsRewriting(true);
    setRewrittenNightmare('');
    setRewrittenTemplate('');

    try {
      const response = await fetch('/api/nightmare-conversion/rewrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          anxiety: extractedAnxiety,
          originalStory: generatedNightmare,
          customInstructions: customInstructions,
          genderPreference: genderPreference || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      setRewrittenTemplate(data.templateSelection || '');
      setRewrittenNightmare(data.nightmare);
      setRewrittenWordCount(data.wordCount);

      toast({
        title: "Story rewritten!",
        description: `Generated ${data.wordCount} words with custom instructions.`,
      });

    } catch (error) {
      console.error('Rewrite error:', error);
      toast({
        title: "Rewrite failed",
        description: error instanceof Error ? error.message : "Failed to rewrite story",
        variant: "destructive",
      });
    } finally {
      setIsRewriting(false);
    }
  };

  const handleCopyNightmare = () => {
    navigator.clipboard.writeText(generatedNightmare);
    toast({
      title: "Copied to clipboard",
      description: "Nightmare story copied successfully",
    });
  };

  return (
    <div className="space-y-6" id="nightmare-conversion">
      <Card className="bg-gradient-to-br from-purple-50 to-red-50 dark:from-purple-950/20 dark:to-red-950/20 border-2 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-red-600 bg-clip-text text-transparent">
            Nightmare Conversion
          </CardTitle>
          <CardDescription className="text-base">
            Convert non-fiction into nightmare stories where the author's deepest fear materializes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'paste' | 'upload')}>
            <TabsList className="grid w-full grid-cols-2" data-testid="tabs-nightmare-mode">
              <TabsTrigger value="paste" data-testid="tab-paste-nightmare">Paste Text</TabsTrigger>
              <TabsTrigger value="upload" data-testid="tab-upload-nightmare">Upload File</TabsTrigger>
            </TabsList>

            <TabsContent value="paste" className="space-y-4">
              <div>
                <Label htmlFor="nightmare-input-text" className="text-base font-medium">
                  Non-Fiction Text
                </Label>
                <Textarea
                  id="nightmare-input-text"
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste non-fiction text to analyze the author's core anxiety and convert into nightmare story..."
                  className="min-h-[200px] mt-2 font-mono text-sm"
                  data-testid="textarea-nightmare-input"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {inputText.length} characters
                </p>
              </div>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <div>
                <Label className="text-base font-medium">
                  Upload Document
                </Label>
                <DragDropUpload
                  accept=".txt,.pdf,.docx"
                  maxSizeBytes={5 * 1024 * 1024}
                  onFileAccepted={handleFileAccepted}
                  onValidationError={handleValidationError}
                  onClear={handleClearFile}
                  currentFileName={uploadedFileName}
                  currentFileSize={uploadedFileSize}
                  data-testid="drag-drop-upload-nightmare"
                  className="mt-2"
                />
              </div>
            </TabsContent>
          </Tabs>

          <div>
            <Label htmlFor="nightmare-gender" className="text-base font-medium">
              Gender Preference (Optional)
            </Label>
            <Select value={genderPreference} onValueChange={setGenderPreference}>
              <SelectTrigger id="nightmare-gender" className="mt-2" data-testid="select-gender-preference">
                <SelectValue placeholder="Neutral (default)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Neutral</SelectItem>
                <SelectItem value="boy-lit">Boy-lit templates</SelectItem>
                <SelectItem value="girl-lit">Girl-lit templates</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Choose template orientation or leave neutral
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || (mode === 'paste' && !inputText.trim()) || (mode === 'upload' && !selectedFile)}
              className="flex-1 bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-700 hover:to-red-700"
              data-testid="button-generate-nightmare"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Nightmare...
                </>
              ) : (
                "Generate Nightmare"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={isGenerating}
              data-testid="button-clear-nightmare"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {extractedAnxiety && (
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="text-lg">Core Anxiety Identified</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm italic text-muted-foreground" data-testid="text-anxiety">
              "{extractedAnxiety}"
            </p>
          </CardContent>
        </Card>
      )}

      {templateSelection && (
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="text-lg">Template Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground" data-testid="text-template-selection">
              {templateSelection}
            </p>
          </CardContent>
        </Card>
      )}

      {generatedNightmare && (
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Nightmare Story</CardTitle>
                <CardDescription>{wordCount} words</CardDescription>
              </div>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" data-testid="button-send-nightmare">
                      Send to <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      const event = new CustomEvent('sendToChat', { detail: generatedNightmare });
                      window.dispatchEvent(event);
                      toast({ title: "Sent to Chat", description: "Nightmare story sent to Ask A Philosopher" });
                    }} data-testid="menu-send-to-chat">
                      Send to Ask A Philosopher
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      const event = new CustomEvent('sendToPaperWriter', { detail: generatedNightmare });
                      window.dispatchEvent(event);
                      toast({ title: "Sent to Paper Writer", description: "Nightmare story sent to Paper Writer" });
                    }} data-testid="menu-send-to-paper">
                      Send to Paper Writer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyNightmare}
                  data-testid="button-copy-nightmare"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div 
              className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-sm"
              data-testid="text-nightmare-output"
            >
              {generatedNightmare}
            </div>
          </CardContent>
        </Card>
      )}

      {generatedNightmare && (
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="text-lg">Rewrite Story with Custom Instructions</CardTitle>
            <CardDescription>
              Provide custom instructions to rewrite the nightmare story
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="custom-instructions" className="text-base font-medium">
                Custom Instructions
              </Label>
              <Textarea
                id="custom-instructions"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Example: Make it more like Poe's Tell-Tale Heart with paranoid first-person narration... Add more documentary details with specific dates... Make the ending more brutal..."
                className="min-h-[100px] mt-2"
                data-testid="textarea-custom-instructions"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Specify how you want the story rewritten (template style, tone, details, etc.)
              </p>
            </div>

            <Button
              onClick={handleRewrite}
              disabled={isRewriting || !customInstructions.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-700 hover:to-red-700"
              data-testid="button-rewrite-nightmare"
            >
              {isRewriting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rewriting Story...
                </>
              ) : (
                "Rewrite Story"
              )}
            </Button>

            {rewrittenNightmare && (
              <div className="space-y-4 mt-6 pt-6 border-t">
                {rewrittenTemplate && (
                  <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold mb-2">Updated Template:</h4>
                    <p className="text-sm text-muted-foreground" data-testid="text-rewritten-template">
                      {rewrittenTemplate}
                    </p>
                  </div>
                )}
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold">Rewritten Story</h4>
                    <span className="text-sm text-muted-foreground">{rewrittenWordCount} words</span>
                  </div>
                  <div 
                    className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-sm bg-gradient-to-br from-purple-50/50 to-red-50/50 dark:from-purple-950/10 dark:to-red-950/10 p-4 rounded-lg"
                    data-testid="text-rewritten-nightmare"
                  >
                    {rewrittenNightmare}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
