import { TpaServer, TpaSession } from '@augmentos/sdk';
import OpenAI from 'openai';

const openai = new OpenAI();

// Load configuration from environment variables
const PACKAGE_NAME = process.env.PACKAGE_NAME || "com.example.myfirstaugmentosapp";
const PORT = parseInt(process.env.PORT || "3000");
const AUGMENTOS_API_KEY = process.env.AUGMENTOS_API_KEY;

if (!AUGMENTOS_API_KEY) {
    console.error("AUGMENTOS_API_KEY environment variable is required");
    process.exit(1);
}

class MyAugmentOSApp extends TpaServer {

    private state: 'WAITING' | 'THINKING' | 'JOKE' = 'WAITING';

    protected async onSession(session: TpaSession, sessionId: string, userId: string): Promise<void> {
        console.log(`New session: ${sessionId} for user ${userId}`);

        setTimeout(() => {
          session.layouts.showTextWall("Dad is ready when you are!");
        }, 5000);


        const eventHandlers = [
            session.events.onTranscription(async (data) => {
                if (data.isFinal && this.state === 'WAITING') {
                    this.state = 'THINKING';
                    session.layouts.showTextWall("Dad is thinking...");


                    console.log(`Generating joke for session ${sessionId} with input: ${data.text}`);
                    const response = await openai.responses.create({
                        model: 'gpt-4.1',
                        instructions: `You are a Dad Joke generator. You will receive a piece of the user's ocnversation. You must respond with a relevant Dad Joke. It must be a short joke, no more than 20 words. Do not include any additional text or explanations.`,
                        input: data.text,
                      });

                    const joke = response.output_text;
                    console.log(`Generated joke for session ${sessionId}: ${joke}`);

                    this.state = 'JOKE';
                    session.layouts.showTextWall(joke);

                    setTimeout(() => {
                        this.state = 'WAITING';
                        session.layouts.showTextWall("Dad is ready when you are!");
                    }, 10000);
                } 
            })
        ];

        eventHandlers.forEach(eventHandler => this.addCleanupHandler(eventHandler));

        session.events.onDisconnected(() => {
            console.log(`Session ${sessionId} disconnected.`);
        });
    }
}

const server = new MyAugmentOSApp({
    packageName: PACKAGE_NAME,
    apiKey: AUGMENTOS_API_KEY,
    port: PORT
});

server.start().catch(err => {
    console.error("Failed to start server:", err);
});