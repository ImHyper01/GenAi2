import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
  Avatar,
} from '@chatscope/chat-ui-kit-react';
import './App.css';

export default function App() {
  const [messages, setMessages] = useState([
    {
      message: "Hallo, ik ben Soul, je AI-klantenservice-assistent van Coolblue! Hoe kan ik je helpen?",
      sender: "Soul",
    },
  ]);
  const [typing, setTyping] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [listening, setListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  const genAI = new GoogleGenerativeAI("AIzaSyCuCC3E4BLeF2PAmxfpJnkay9ZbQ6jyl7c");

  const systemPrompt = `
Hallo, ik ben Soul, een AI-klantenservice-assistent van Coolblue. Mijn doel is om klanten te helpen door duidelijke, vriendelijke en nuttige antwoorden te geven op hun vragen. Ik ben altijd empathisch, behulpzaam en professioneel.

**Belangrijke richtlijnen voor mij als AI-assistent:**

1. **Inleiding en Klantgerichtheid:**
   - Begroet de klant vriendelijk.
   - Stel jezelf voor als "Soul, een AI-klantenservice-assistent".
   - Vraag hoe ik kan helpen en luister naar de vraag van de klant.

2. **Empathie en Geduld:**
   - Toon begrip en empathie, vooral als een klant een probleem ervaart.
   - Geef geruststellende reacties zoals: "Ik begrijp dat dit vervelend is voor u. Laten we samen een oplossing vinden."

3. **Helderheid en Relevantie:**
   - Beantwoord de vraag direct en duidelijk.
   - Geef relevante informatie, zonder af te dwalen van het onderwerp.
   - Als je een vraag niet direct kunt beantwoorden, bied excuses aan en vraag om verduidelijking.

4. **Beperkingen en Hulp:** 
   - Geef aan dat ik een AI-assistent ben en beperkingen heb.
   - Als ik iets niet weet, zeg ik eerlijk: "Dat weet ik helaas niet, maar ik kan helpen het uit te zoeken."

5. **Probleemoplossing:**
   - Geef praktische en stapsgewijze oplossingen bij technische of praktische problemen.
   - Controleer of de klant tevreden is met de oplossing voordat je het gesprek afsluit.

6. **Tone of Voice:**
   - Gebruik altijd een vriendelijke, professionele en respectvolle toon.
   - Vermijd technisch jargon. Gebruik eenvoudige en toegankelijke taal.

7. **Uitgebreide scenario's:**
   - **Vragen over producten:** Geef een beknopte beschrijving van het product en verwijs naar de website voor meer details.
   - **Problemen met bestellingen:** Vraag om specifieke details zoals ordernummer of bezorgadres om te helpen.
   - **Algemene vragen:** Geef een relevant antwoord of leg uit waar de klant aanvullende informatie kan vinden.

**Voorbeeldgesprek:**

Klant: "Ik wil weten waar mijn bestelling is."
Soul: "Hallo, ik ben Soul, uw AI-klantenservice-assistent van Coolblue. Wat vervelend om te horen dat u nog op uw bestelling wacht! Als u mij het ordernummer kunt geven, kan ik u helpen om de status te controleren."

Klant: "Mijn product werkt niet zoals verwacht."
Soul: "Dat spijt me om te horen! Kunt u me meer vertellen over het probleem, zodat ik een passende oplossing kan bieden?"

**Belangrijk:** Zorg ervoor dat de klant altijd tevreden en geholpen het gesprek verlaat.
s
`;

  useEffect(() => {
    if ("webkitSpeechRecognition" in window) {
      const speechRecognition = new window.webkitSpeechRecognition();
      speechRecognition.continuous = false;
      speechRecognition.interimResults = false;
      speechRecognition.lang = "nl-NL";

      speechRecognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleSend(transcript);
        setListening(false);
      };

      speechRecognition.onerror = (error) => {
        console.error("Speech Recognition Error:", error);
        setListening(false);
      };

      setRecognition(speechRecognition);
    }
  }, []);

  const handleSend = async (message) => {
    const userMessage = { message, sender: "user", direction: "outgoing" };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    setTyping(true);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(`${systemPrompt}\nKlant: ${message}\nSoul:`);
      const responseText = result.response.text();

      const soulMessage = { message: responseText, sender: "Soul" };
      setMessages([...updatedMessages, soulMessage]);

      if (speechEnabled) {
        speak(responseText);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages([
        ...updatedMessages,
        { message: "Sorry, er is iets misgegaan. Probeer het later opnieuw.", sender: "Soul" },
      ]);
    }

    setTyping(false);
  };

  const startListening = () => {
    if (recognition) {
      recognition.start();
      setListening(true);
    }
  };

  const speak = (text) => {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "nl-NL";
    speech.rate = 1;
    window.speechSynthesis.speak(speech);
  };

  return (
    <div className="App">
      {/* Navigatiebalk */}
      <nav className="navbar">
        <div className="container">
          <h1>Coolblue Klantenservice</h1>
          <div>
            <button
              onClick={() => setSpeechEnabled(!speechEnabled)}
              className="btn-toggle"
            >
              Spraak {speechEnabled ? "Uitschakelen" : "Inschakelen"}
            </button>
            <button
              onClick={startListening}
              disabled={listening}
              className="btn-listen"
            >
              {listening ? "Luisteren..." : "Praat met Soul"}
            </button>
          </div>
        </div>
      </nav>

      {/* Chatbot Container */}
      <div className="chat-container">
        <MainContainer>
          <ChatContainer>
            <MessageList
              typingIndicator={typing ? <TypingIndicator content="Soul is aan het typen..." /> : null}
            >
              {messages.map((message, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: message.sender === "Soul" ? "flex-start" : "flex-end",
                    alignItems: "flex-start",
                    marginBottom: "10px",
                  }}
                >
                  {/* Profielfoto */}
                  {message.sender === "Soul" && (
                    <Avatar src="/soul.jpeg" name="Soul" size="lg" style={{ marginRight: "10px" , marginTop: "10px"}} />
                  )}
                  <div
                    style={{
                      maxWidth: "60%",
                      backgroundColor: message.sender === "Soul" ? "#e3f2fd" : "#c8e6c9",
                      color: message.sender === "Soul" ? "#000" : "#000",
                      borderRadius: "15px",
                      padding: "10px 15px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      textAlign: "left",
                    }}
                  >
                    {/* Naam van de afzender */}
                    {message.sender === "Soul" && (
                      <div style={{ fontSize: "0.8em", fontWeight: "bold", marginBottom: "5px" }}>Soul</div>
                    )}
                    {message.message}
                  </div>
                  {/* Profielfoto voor de gebruiker (optioneel) */}
                  {message.sender === "user" && (
                    <Avatar src="/User-avatar.png" name="User" size="lg" style={{ marginLeft: "10px" }} />
                  )}
                </div>
              ))}
            </MessageList>
            <MessageInput placeholder="Typ hier je bericht..." onSend={handleSend} />
          </ChatContainer>
        </MainContainer>
      </div>
    </div>
  );
}
