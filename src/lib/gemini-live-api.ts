
/**
 * Simple client for Gemini Multimodal Live API via WebSockets.
 */
export class GeminiLiveClient {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private url: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    // Note: In a production app, you might route this through a proxy or use ephemeral tokens
    this.url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
  }

  async connect(config: any) {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        this.ws.binaryType = "arraybuffer";

        const timeout = setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            this.ws?.close();
            reject(new Error("Connection timed out (10s). Verify API Key or model access."));
          }
        }, 10000);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          console.log("Connected to Gemini Live API");
          this.sendSetup(config);
          resolve(true);
        };

        this.ws.onerror = (error) => {
          clearTimeout(timeout);
          console.error("WebSocket error state:", error);
          this.onerror?.(error);
          reject(error);
        };

        this.ws.onclose = (event) => {
          clearTimeout(timeout);
          console.log(`Disconnected from Gemini Live API. Code: ${event.code}, Reason: ${event.reason}`);
          if (event.code !== 1000) {
            this.onerror?.(`Disconnected: ${event.reason || "Unknown reason"}`);
          }
        };

        this.ws.onmessage = async (event) => {
          let data = event.data;
          if (data instanceof ArrayBuffer || data instanceof Blob) {
            const text = await new Response(data).text();
            this.handleMessage(text);
          } else {
            this.handleMessage(data);
          }
        };

      } catch (err) {
        console.error("Immediate WebSocket error:", err);
        reject(err);
      }
    });
  }

  private sendSetup(config: any) {
    const setupMessage = {
      setup: {
        model: "models/gemini-3.1-flash-live-preview",
        generation_config: {
          ...config.generationConfig,
          response_modalities: ["audio"]
        },
        system_instruction: {
          parts: [{ text: config.systemInstruction || "" }]
        }
      },
    };
    console.log("Sending Gemini Live Setup:", JSON.stringify(setupMessage));
    this.ws?.send(JSON.stringify(setupMessage));
  }

  sendText(text: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          realtime_input: {
            text: text
          },
        })
      );
    }
  }

  sendAudio(base64Audio: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          realtime_input: {
            audio: {
              data: base64Audio,
              mime_type: "audio/pcm;rate=16000",
            },
          },
        })
      );
    }
  }

  sendToolResponse(toolResponses: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        tool_response: {
          function_responses: toolResponses
        }
      }));
    }
  }

  private handleMessage(data: string) {
    console.log("Gemini Live Raw Message:", data.length > 500 ? data.substring(0, 500) + "..." : data);
    try {
      const parsed = JSON.parse(data);

      const error = parsed.error;
      if (error) {
        console.error("Gemini Live Server Error Event:", error);
        this.onerror?.(error.message || "Unknown server error");
        return;
      }

      if (parsed.setup_complete || parsed.setupComplete) {
        console.log("Gemini Live: Setup confirmed by server");
        this.onSetupComplete?.();
      }

      const serverContent = parsed.server_content || parsed.serverContent;
      if (serverContent) {
        const modelTurn = serverContent.model_turn || serverContent.modelTurn;
        if (modelTurn && modelTurn.parts) {
          modelTurn.parts.forEach((part: any) => {
            const inlineData = part.inline_data || part.inlineData;
            if (inlineData) {
              this.onAudioData?.(inlineData.data);
            }
            if (part.text) {
              this.onTextData?.(part.text);
            }
            if (part.call) {
              this.onToolCall?.(part.call);
            }
          });
        }
        if (serverContent.interrupted) {
          this.onInterrupted?.();
        }
      }
    } catch (e) {
      console.error("Error parsing message:", e, "Raw data:", data);
    }
  }

  onAudioData?: (base64Audio: string) => void;
  onTextData?: (text: string) => void;
  onToolCall?: (call: any) => void;
  onInterrupted?: () => void;
  onSetupComplete?: () => void;
  onerror?: (error: any) => void;

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}
