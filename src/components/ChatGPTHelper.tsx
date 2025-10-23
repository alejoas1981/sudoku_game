import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { HelpCircle, Bot, MessageCircle } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { useGPT } from '@/hooks/useGPT';
import { GameState } from '@/hooks/useGameState';
import { Translation } from '@/lib/i18n';

interface ChatGPTHelperProps {
    gameState: GameState;
}

export const ChatGPTHelper: React.FC<ChatGPTHelperProps> = ({ gameState }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
    const [input, setInput] = useState('');
    
    const getGameContext = () => {
        const { 
            grid, 
            difficulty, 
            timer, 
            gameCompleted, 
            errorCells, 
            givenCells, 
            solution, 
            selectedCell 
        } = gameState;
        
        const filledCells = grid.flat().filter((cell: number) => cell !== 0).length;
        const totalCells = 81;
        const progress = Math.round((filledCells / totalCells) * 100);
        
        return {
            grid,
            givenCells,
            solution,
            selectedCell,
            difficulty,
            progress,
            timer,
            gameCompleted,
            errorCount: errorCells.length,
        };
    };
    
    const { sendMessage: sendToGPT, isLoading: gptLoading, error: gptError } = useGPT();
    
    const handleSend = async (message: string) => {
        if (!message.trim()) return;
        
        const gameContext = getGameContext();
        setMessages(prev => [...prev, { role: 'user', content: message }]);
        setInput('');
        
        const reply = await sendToGPT(message, gameContext);
        if (reply) setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    };
    
    const quickTipKeys: Array<keyof Translation['chat']['quickTips']> = ['strategy', 'stuck', 'faster', 'rules'];
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="journal-button outline"
                >
                    <HelpCircle className="w-4 h-4 mr-2" />
                    {t('help.askAssistant')}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Bot className="w-5 h-5" />
                        {t('help.title')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('help.description')}
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex-1 min-h-0 overflow-y-auto space-y-4 p-4 border rounded-lg bg-muted/20" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <div className="flex-1 overflow-y-auto space-y-4 p-4 border rounded-lg bg-muted/20 min-h-[300px]">
                        {messages.length === 0 && (
                            <div className="text-center text-muted-foreground">
                                <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>{t('chat.welcome')}</p>
                            </div>
                        )}
                        
                        {messages.map((message, index) => (
                            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-lg ${
                                    message.role === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-card border'
                                }`}>
                                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                                </div>
                            </div>
                        ))}
                        
                        {gptLoading && (
                            <div className="flex justify-start">
                                <div className="bg-card border p-3 rounded-lg">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                        {t('chat.thinking')}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {messages.length === 0 && (
                        <div className="p-4 space-y-2">
                            <p className="text-sm text-muted-foreground">{t('chat.quickQuestions')}</p>
                            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2"> {/* <-- THE FINAL FIX */}
                                {quickTipKeys.map((tipKey, index) => {
                                    const tipText = t(`chat.quickTips.${tipKey}`);
                                    return (
                                        <Button
                                            key={index}
                                            variant="outline"
                                            size="sm"
                                            className="justify-start text-left h-auto py-2 px-3"
                                            onClick={() => handleSend(tipText)}
                                        >
                                            <MessageCircle className="w-3 h-3 mr-2 flex-shrink-0" />
                                            <span className="text-xs whitespace-normal">{tipText}</span>
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    
                    <div className="flex gap-2 pt-4">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend(input)}
                            placeholder={t('chat.placeholder')}
                            className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                            disabled={gptLoading}
                        />
                        <Button
                            onClick={() => handleSend(input)}
                            disabled={!input.trim() || gptLoading}
                            size="sm"
                            className="journal-button primary"
                        >
                            {t('chat.send')}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
