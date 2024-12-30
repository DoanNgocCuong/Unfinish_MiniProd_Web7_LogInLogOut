import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, Text, useToast, VStack } from '@chakra-ui/react';

const MIN_UPDATE_INTERVAL = 300; // Minimum time between updates in ms

const AudioStream = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [responses, setResponses] = useState([]);

  const websocketRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const updateTimeoutRef = useRef(null);
  const responsesEndRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);
  const previousTextRef = useRef('');
  const transcriptQueueRef = useRef([]);

  const toast = useToast();

  const scrollToBottom = () => {
    responsesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const resampleTo16kHz = (audioData, origSampleRate = 44100) => {
    const data = new Float32Array(audioData);
    const targetLength = Math.round(data.length * (16000 / origSampleRate));
    const resampledData = new Float32Array(targetLength);
    const springFactor = (data.length - 1) / (targetLength - 1);

    resampledData[0] = data[0];
    resampledData[targetLength - 1] = data[data.length - 1];

    for (let i = 1; i < targetLength - 1; i++) {
      const index = i * springFactor;
      const leftIndex = Math.floor(index);
      const rightIndex = Math.ceil(index);
      const fraction = index - leftIndex;
      resampledData[i] = data[leftIndex] + (data[rightIndex] - data[leftIndex]) * fraction;
    }

    return resampledData;
  };

  const removeDuplicatePhrase = (text) => {
    const phrases = text.split(/(?<=[.!?])\s+/);
    const uniquePhrases = [];
    const seen = new Set();
    
    for (const phrase of phrases) {
      const trimmedPhrase = phrase.trim();
      if (trimmedPhrase && !seen.has(trimmedPhrase)) {
        seen.add(trimmedPhrase);
        uniquePhrases.push(trimmedPhrase);
      }
    }
    
    return uniquePhrases.join(' ');
  };

  const updateTranscript = (text) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    transcriptQueueRef.current.push(text);

    updateTimeoutRef.current = setTimeout(() => {
      const currentTime = Date.now();
      if (currentTime - lastUpdateTimeRef.current < MIN_UPDATE_INTERVAL) {
        return;
      }

      const latestText = transcriptQueueRef.current[transcriptQueueRef.current.length - 1];
      transcriptQueueRef.current = [];

      if (latestText === previousTextRef.current) {
        return;
      }

      const cleanedText = removeDuplicatePhrase(latestText);
      setResponses(prev => [...prev, { text: cleanedText, timestamp: new Date().toLocaleTimeString() }]);
      scrollToBottom();

      previousTextRef.current = latestText;
      lastUpdateTimeRef.current = currentTime;
    }, 100);
  };

  const startRecording = async () => {
    try {
      setIsPlaying(true);
      setError(null);

      // Reset states
      previousTextRef.current = '';
      transcriptQueueRef.current = [];
      lastUpdateTimeRef.current = 0;
      setResponses([{ text: 'Waiting for speech...', timestamp: new Date().toLocaleTimeString() }]);

      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaStreamSource = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      websocketRef.current = new WebSocket("wss://streaming-wp.hacknao.edu.vn");
      
      websocketRef.current.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
      };

      websocketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.message === "DISCONNECT") {
            stopStream();
            return;
          }
          
          if (data.segments && data.segments.length > 0) {
            const latestSegments = data.segments
              .map(segment => segment.text.trim())
              .filter(text => text.length > 0);
              
            if (latestSegments.length > 0) {
              const latestText = latestSegments[latestSegments.length - 1];
              updateTranscript(latestText);
            }
          }
        } catch (err) {
          console.error('Error processing message:', err);
        }
      };

      processorRef.current.onaudioprocess = (event) => {
        if (websocketRef.current?.readyState === WebSocket.OPEN) {
          const inputData = event.inputBuffer.getChannelData(0);
          const audioData16kHz = resampleTo16kHz(inputData, audioContextRef.current.sampleRate);
          websocketRef.current.send(audioData16kHz);
        }
      };

      mediaStreamSource.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording: ' + err.message);
      stopStream();
    }
  };

  const stopStream = () => {
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }

      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      if (websocketRef.current) {
        websocketRef.current.send(JSON.stringify({ message: "STOP" }));
        websocketRef.current.close();
        websocketRef.current = null;
      }

      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      setIsPlaying(false);
      setIsConnected(false);
    } catch (err) {
      console.error('Error stopping stream:', err);
      setError('Error stopping stream: ' + err.message);
    }
  };

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  return (
    <VStack spacing={4} align="stretch" p={4} mt="80px">
      <Box>
        <Button
          colorScheme="green"
          onClick={startRecording}
          isDisabled={isPlaying}
          mr={2}
        >
          Start Recording
        </Button>
        <Button
          colorScheme="red"
          onClick={stopStream}
          isDisabled={!isPlaying}
        >
          Stop Recording
        </Button>
        <Box as="span" ml={4} display="inline-flex" alignItems="center">
          <Box
            w="10px"
            h="10px"
            borderRadius="50%"
            bg={isPlaying ? "red.500" : "gray.300"}
            animation={isPlaying ? "pulse 1.5s infinite" : "none"}
            mr={2}
          />
          <Text>{isPlaying ? 'Recording...' : 'Ready to record'}</Text>
        </Box>
      </Box>

      {error && (
        <Box p={3} bg="red.100" color="red.700" borderRadius="md">
          {error}
        </Box>
      )}

      <Box
        borderWidth={1}
        p={4}
        borderRadius="md"
        maxHeight="400px"
        overflowY="auto"
        bg="gray.50"
      >
        {responses.map((response, index) => (
          <Text
            key={index}
            mb={2}
            fontSize="lg"
            opacity={1}
            transform="translateY(0)"
            transition="opacity 0.2s, transform 0.2s"
          >
            {response.text}
          </Text>
        ))}
        <div ref={responsesEndRef} />
      </Box>
    </VStack>
  );
};

export default AudioStream;
