class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // Match ESP32's I2S config
    this.sampleRate = 16000;
    this.bitsPerSample = 16;
    this.channels = 1;
    this.processCount = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channel = input[0];
    this.processCount++;
    
    try {
      // Convert Float32 samples to Int16 (similar to ESP32's i2s_adc_data_scale)
      const pcmData = new Int16Array(channel.length);
      
      for (let i = 0; i < channel.length; i++) {
        // Scale float32 [-1,1] to int16 [-32768,32767]
        const sample = Math.max(-1, Math.min(1, channel[i])); // Clamp between -1 and 1
        pcmData[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      }

      // Log every 100th frame for debugging
      if (this.processCount % 100 === 0) {
        console.log('Audio frame processed:', {
          frameSize: channel.length,
          sampleRate: this.sampleRate,
          firstSample: pcmData[0],
          lastSample: pcmData[pcmData.length - 1]
        });
      }

      // Send the PCM data to the main thread
      this.port.postMessage({
        eventType: 'audio',
        sampleRate: this.sampleRate,
        bitsPerSample: this.bitsPerSample,
        channels: this.channels,
        audioData: pcmData.buffer,
        frameNumber: this.processCount
      }, [pcmData.buffer]);

    } catch (error) {
      console.error('Error processing audio:', error);
    }

    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);
