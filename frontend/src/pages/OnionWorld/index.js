import React, { useCallback, useEffect, useState, useRef } from 'react';
import { ReactFlow, Controls, Background, useNodesState, useEdgesState, addEdge, MarkerType, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Box, Button, HStack, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure, VStack, Text, IconButton, Select, useToast, Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton, ButtonGroup } from "@chakra-ui/react";
import { FaPlay, FaStop } from 'react-icons/fa';
import JSZip from 'jszip';

const initialNodes = [
  {
    id: '1',
    type: 'dialogueNode',
    position: { x: 250, y: 50 },
    data: { 
      label: 'Stage 0',
      dialogue: [''],
      choices: [],
      effect: '',
      openFunction: '',
      onComplete: ''
    },
  }
];

const initialEdges = [];

// Custom node component
const DialogueNode = ({ data, id }) => {
  const [playingAudio, setPlayingAudio] = useState(null);
  const audioRef = useRef(null);

  const handleAddDialogue = () => {
    data.setNodeData(id, {
      ...data,
      dialogue: Array.isArray(data.dialogue) ? [...data.dialogue, ''] : ['']
    });
  };

  const handleRemoveDialogue = () => {
    if (Array.isArray(data.dialogue) && data.dialogue.length > 1) {
      data.setNodeData(id, {
        ...data,
        dialogue: data.dialogue.slice(0, -1)
      });
    }
  };

  const handleDialogueChange = (index, field, value) => {
    const newDialogues = Array.isArray(data.dialogue) 
      ? [...data.dialogue] 
      : [{ text: data.dialogue || '', translation: '' }];
    
    newDialogues[index] = {
      ...newDialogues[index],
      [field]: value
    };
    
    data.setNodeData(id, {
      ...data,
      dialogue: newDialogues
    });
  };

  // Add handlers for choices
  const handleAddChoice = () => {
    const currentChoices = Array.isArray(data.choices) ? data.choices : [];
    data.setNodeData(id, {
      ...data,
      choices: [...currentChoices, { text: '', link: '' }]
    });
  };

  const handleRemoveChoice = () => {
    if (Array.isArray(data.choices) && data.choices.length > 0) {
      data.setNodeData(id, {
        ...data,
        choices: data.choices.slice(0, -1)
      });
    }
  };

  const handleChoiceChange = (index, field, value) => {
    if (Array.isArray(data.choices)) {
      const newChoices = [...data.choices];
      newChoices[index] = {
        ...newChoices[index],
        [field]: value
      };
      data.setNodeData(id, {
        ...data,
        choices: newChoices
      });
    }
  };

  const handleLabelChange = (e) => {
    data.setNodeData(id, {
      ...data,
      label: e.target.value
    });
  };

  const handleFunctionChange = (e) => {
    data.setNodeData(id, {
      ...data,
      openFunction: e.target.value,
      // Reset function-specific fields when changing function
      functionData: {}
    });
  };

  const handleFunctionDataChange = (field, value) => {
    data.setNodeData(id, {
      ...data,
      functionData: {
        ...data.functionData,
        [field]: value
      }
    });
  };

  const handleOnCompleteChange = (e) => {
    data.setNodeData(id, {
      ...data,
      onComplete: e.target.value,
      // Reset onComplete-specific data when changing action
      onCompleteData: {}
    });
  };

  const handleOnCompleteDataChange = (field, value) => {
    data.setNodeData(id, {
      ...data,
      onCompleteData: {
        ...data.onCompleteData,
        [field]: value
      }
    });
  };

  const renderFunctionInputs = () => {
    switch (data.openFunction) {
      case 'Asr':
        return (
          <div className="function-inputs">
            <div className="input-group">
              <label>Asr</label>
              <input
                type="text"
                value={data.functionData?.asr || ''}
                onChange={(e) => handleFunctionDataChange('asr', e.target.value)}
                placeholder="Asr value"
              />
            </div>
            <div className="input-group">
              <label>Score</label>
              <input
                type="number"
                value={data.functionData?.score || ''}
                onChange={(e) => handleFunctionDataChange('score', e.target.value)}
                placeholder="Score value"
              />
            </div>
          </div>
        );

      case 'Onion':
        return (
          <div className="function-inputs">
            <div className="input-group">
              <label>ID</label>
              <input
                type="text"
                value={data.functionData?.id || ''}
                onChange={(e) => handleFunctionDataChange('id', e.target.value)}
                placeholder="ID"
              />
            </div>
            <div className="input-group">
              <label>Rive Onion Char</label>
              <input
                type="text"
                value={data.functionData?.rive_onion_char || ''}
                onChange={(e) => handleFunctionDataChange('rive_onion_char', e.target.value)}
                placeholder="Rive onion char"
              />
            </div>
            <div className="input-group">
              <label>Rive Onion BG</label>
              <input
                type="text"
                value={data.functionData?.rive_onion_bg || ''}
                onChange={(e) => handleFunctionDataChange('rive_onion_bg', e.target.value)}
                placeholder="Rive onion background"
              />
            </div>
          </div>
        );

      case 'Communicate_Lesson':
        return (
          <div className="function-inputs">
            <div className="input-group">
              <label>Lesson ID</label>
              <input
                type="text"
                value={data.functionData?.lesson_id || ''}
                onChange={(e) => handleFunctionDataChange('lesson_id', e.target.value)}
                placeholder="Lesson ID"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const handleAddEffect = () => {
    const currentEffects = Array.isArray(data.effects) ? data.effects : [];
    data.setNodeData(id, {
      ...data,
      effects: [...currentEffects, { key: '', value: false }]
    });
  };

  const handleRemoveEffect = () => {
    if (Array.isArray(data.effects) && data.effects.length > 0) {
      data.setNodeData(id, {
        ...data,
        effects: data.effects.slice(0, -1)
      });
    }
  };

  const handleEffectChange = (index, field, value) => {
    if (Array.isArray(data.effects)) {
      const newEffects = [...data.effects];
      newEffects[index] = {
        ...newEffects[index],
        [field]: field === 'value' ? value === 'true' : value
      };
      data.setNodeData(id, {
        ...data,
        effects: newEffects
      });
    }
  };

  const handlePlayAudio = (audioUrl, index) => {
    if (playingAudio === index) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        setPlayingAudio(null);
      };
      audioRef.current = audio;
      audio.play();
      setPlayingAudio(index);
    }
  };

  return (
    <div className="dialogue-node wide-node">
      <Handle 
        type="target" 
        position={Position.Top} 
        id="target"
        isConnectable={true}
        style={{ 
          background: '#ffffff',
          border: '3px solid #88ccff',
          width: '20px',
          height: '20px',
          top: '-10px',
        }} 
      />
      
      <div className="node-header">
        <div className="node-title">{data.label}</div>
      </div>
      
      <div className="node-section">
        <label>Dialogue</label>
        {Array.isArray(data.dialogue) ? (
          data.dialogue.map((dialog, index) => (
            <div key={index} className="dialogue-row">
              <input
                type="text"
                value={dialog.text || ''}
                onChange={(e) => handleDialogueChange(index, 'text', e.target.value)}
                placeholder={`English ${index + 1}`}
                className="dialogue-input"
              />
              <input
                type="text"
                value={dialog.translation || ''}
                onChange={(e) => handleDialogueChange(index, 'translation', e.target.value)}
                placeholder={`Vietnamese ${index + 1}`}
                className="dialogue-input"
              />
              {dialog.audio && (
                <IconButton
                  icon={playingAudio === index ? <FaStop /> : <FaPlay />}
                  aria-label={`Play audio ${index + 1}`}
                  onClick={() => handlePlayAudio(dialog.audio, index)}
                  colorScheme={playingAudio === index ? "red" : "blue"}
                  size="sm"
                />
              )}
            </div>
          ))
        ) : (
          <div className="dialogue-row">
            <input
              type="text"
              value={data.dialogue?.text || ''}
              onChange={(e) => handleDialogueChange(0, 'text', e.target.value)}
              placeholder="English 1"
              className="dialogue-input"
            />
            <input
              type="text"
              value={data.dialogue?.translation || ''}
              onChange={(e) => handleDialogueChange(0, 'translation', e.target.value)}
              placeholder="Vietnamese 1"
              className="dialogue-input"
            />
            {data.dialogue?.audio && (
              <IconButton
                icon={playingAudio === 0 ? <FaStop /> : <FaPlay />}
                aria-label="Play audio 1"
                onClick={() => handlePlayAudio(data.dialogue.audio, 0)}
                colorScheme={playingAudio === 0 ? "red" : "blue"}
                size="sm"
              />
            )}
          </div>
        )}
        <div className="button-group">
          <button onClick={handleAddDialogue}>+</button>
          <button onClick={handleRemoveDialogue}>-</button>
        </div>
      </div>

      <div className="node-section">
        <label>Choices</label>
        <div className="choices-container">
          {(Array.isArray(data.choices) ? data.choices : []).map((choice, index) => (
            <div key={index} className="choice-container">
              <div className="choice-inputs">
                <input
                  type="text"
                  value={choice?.text || ''}
                  onChange={(e) => handleChoiceChange(index, 'text', e.target.value)}
                  placeholder={`Choice ${index + 1}`}
                  className="choice-text-input"
                />
                <input
                  type="text"
                  value={choice?.link || ''}
                  onChange={(e) => handleChoiceChange(index, 'link', e.target.value)}
                  placeholder="Enter link"
                  className="choice-link-input"
                />
              </div>
              <Handle
                type="source"
                position={Position.Right}
                id={`choice-${index}`}
                isConnectable={true}
                style={{
                  background: '#ffffff',
                  border: '3px solid #88ccff',
                  width: '18px',
                  height: '18px',
                  right: '-9px',
                }}
              />
            </div>
          ))}
        </div>
        <div className="button-group">
          <button onClick={handleAddChoice}>+</button>
          {Array.isArray(data.choices) && data.choices.length > 0 && (
            <button onClick={handleRemoveChoice}>-</button>
          )}
        </div>
      </div>

      <div className="node-section">
        <label>Effects</label>
        <div className="effects-container">
          {(Array.isArray(data.effects) ? data.effects : []).map((effect, index) => (
            <div key={index} className="effect-container">
              <div className="effect-inputs">
                <input
                  type="text"
                  value={effect?.key || ''}
                  onChange={(e) => handleEffectChange(index, 'key', e.target.value)}
                  placeholder={`Effect ${index + 1}`}
                  className="effect-text-input"
                />
                <select
                  value={effect?.value?.toString() || 'false'}
                  onChange={(e) => handleEffectChange(index, 'value', e.target.value)}
                  className="effect-value-input"
                >
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              </div>
            </div>
          ))}
        </div>
        <div className="button-group">
          <button onClick={handleAddEffect}>+</button>
          {Array.isArray(data.effects) && data.effects.length > 0 && (
            <button onClick={handleRemoveEffect}>-</button>
          )}
        </div>
      </div>

      <div className="node-section">
        <label>Open Function</label>
        <select 
          value={data.openFunction || ''} 
          onChange={handleFunctionChange}
        >
          <option value="">Select function...</option>
          <option value="Asr">Asr</option>
          <option value="Onion">Onion</option>
          <option value="Communicate_Lesson">Communicate_Lesson</option>
        </select>
        {renderFunctionInputs()}
      </div>

      <div className="node-section">
        <label>On Complete</label>
        <select 
          value={data.onComplete || ''} 
          onChange={handleOnCompleteChange}
        >
          <option value="">Select action...</option>
          <option value="AdvanceQuest">Advance Quest</option>
          <option value="QuestCompleted">Quest Completed</option>
        </select>
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="source"
        isConnectable={true}
        style={{ 
          background: '#ffffff',
          border: '3px solid #88ccff',
          width: '20px',
          height: '20px',
          bottom: '-10px',
        }} 
      />

      <button className="remove-button" onClick={() => data.onRemove(id)}>Remove</button>
    </div>
  );
};

// Custom Edge Label component
const EdgeLabel = ({ label }) => (
  <div style={{
    background: 'rgba(255, 255, 255, 0.75)',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    pointerEvents: 'all',
    cursor: 'pointer'
  }}>
    {label}
  </div>
);

const nodeTypes = {
  dialogueNode: DialogueNode
};

const SpeakerModal = ({ isOpen, onClose, nodes, setNodes, onSpeakerSelect }) => {
  const [speakers, setSpeakers] = useState([]);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [selectedSpeaker, setSelectedSpeaker] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const fetchSpeakers = async () => {
      try {
        const response = await fetch('https://tts-dev.hacknao.edu.vn/speakers');
        const data = await response.json();
        setSpeakers(data);
      } catch (error) {
        console.error('Error fetching speakers:', error);
      }
    };

    if (isOpen) {
      fetchSpeakers();
    }
  }, [isOpen]);

  const handlePlayPreview = (previewUrl, speakerId) => {
    if (playingAudio === speakerId) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(previewUrl);
      audio.onended = () => {
        setPlayingAudio(null);
      };
      audioRef.current = audio;
      audio.play();
      setPlayingAudio(speakerId);
    }
  };

  const handleSpeakerChange = (e) => {
    const speaker = speakers.find(s => s.voice_id === e.target.value);
    setSelectedSpeaker(speaker);
    onSpeakerSelect(speaker);
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingAudio(null);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const formatAudioName = (index, text) => {
    // Take first 10 words and clean the text
    const words = text
      .replace(/[^\w\s]/g, '') // Remove special characters
      .split(' ')
      .slice(0, 10)
      .join('_');
    return `${String(index).padStart(3, '0')}_${words}.wav`;
  };

  const handleGenerate = async () => {
    if (!selectedSpeaker) {
      alert('Please select a speaker first');
      return;
    }

    setIsGenerating(true);
    const zip = new JSZip();
    
    try {
      // Collect all English texts from all nodes
      const allDialogues = nodes.flatMap(node => 
        node.data.dialogue
          .filter(d => d.text) // Filter out empty dialogues
          .map(d => ({
            nodeId: node.id,
            dialogueText: d.text,
            index: node.data.dialogue.indexOf(d)
          }))
      );

      // Process each dialogue text
      for (const [globalIndex, dialogue] of allDialogues.entries()) {
        try {
          const response = await fetch('https://tts-dev.hacknao.edu.vn/tts_to_audio', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: dialogue.dialogueText,
              speaker_wav: selectedSpeaker.voice_id,
              language: "en"
            })
          });

          if (!response.ok) {
            throw new Error(`Failed to generate audio for: ${dialogue.dialogueText}`);
          }

          // Get audio blob directly from response
          const audioBlob = await response.blob();
          
          // Generate filename
          const fileName = formatAudioName(globalIndex + 1, dialogue.dialogueText);
          
          // Add to zip
          zip.file(fileName, audioBlob);

          // Create object URL for preview
          const audioUrl = URL.createObjectURL(audioBlob);

          // Update nodes with new audio data
          setNodes(prevNodes => prevNodes.map(node => {
            if (node.id === dialogue.nodeId) {
              const updatedDialogues = [...node.data.dialogue];
              updatedDialogues[dialogue.index] = {
                ...updatedDialogues[dialogue.index],
                audio: audioUrl,
                audioFileName: fileName
              };
              return {
                ...node,
                data: {
                  ...node.data,
                  dialogue: updatedDialogues
                }
              };
            }
            return node;
          }));

        } catch (error) {
          console.error(`Error generating audio for text: ${dialogue.dialogueText}`, error);
        }
      }

      // Generate zip file
      const currentTime = new Date().toISOString().replace(/[:.]/g, '-');
      const zipFileName = `${selectedSpeaker.name}_${currentTime}.zip`;
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Trigger download
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(zipBlob);
      downloadLink.download = zipFileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

    } catch (error) {
      console.error('Error in generate process:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Text to Speech</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch" pb={4}>
            <Select 
              placeholder="Select speaker"
              onChange={handleSpeakerChange}
              value={selectedSpeaker?.voice_id || ''}
              mb={4}
            >
              {speakers.map((speaker) => (
                <option key={speaker.voice_id} value={speaker.voice_id}>
                  {speaker.name}
                </option>
              ))}
            </Select>

            {selectedSpeaker && (
              <Box 
                p={4}
                borderWidth="1px"
                borderRadius="md"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Text>{selectedSpeaker.name}</Text>
                <IconButton
                  icon={playingAudio === selectedSpeaker.voice_id ? <FaStop /> : <FaPlay />}
                  aria-label={`Play ${selectedSpeaker.name} preview`}
                  onClick={() => handlePlayPreview(selectedSpeaker.preview_url.replace('http://103.253.20.13:25006', 'https://tts-dev.hacknao.edu.vn'), selectedSpeaker.voice_id)}
                  colorScheme={playingAudio === selectedSpeaker.voice_id ? "red" : "blue"}
                />
              </Box>
            )}

            <Button
              onClick={handleGenerate}
              colorScheme="green"
              isLoading={isGenerating}
              loadingText="Generating..."
              isDisabled={!selectedSpeaker}
            >
              Generate Audio for All Dialogues
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const OnionWorld = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedSpeaker, setSelectedSpeaker] = useState(null);
  const toast = useToast();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
  const [currentNode, setCurrentNode] = useState(null);
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);

  // Add this function to get sorted nodes
  const getSortedNodes = useCallback(() => {
    return [...nodes].sort((a, b) => {
      const aNum = parseInt(a.data.label.match(/\d+/)[0]);
      const bNum = parseInt(b.data.label.match(/\d+/)[0]);
      return aNum - bNum;
    });
  }, [nodes]);

  // Add useEffect to load saved data on component mount
  useEffect(() => {
    const savedFlow = localStorage.getItem('onionWorldFlow');
    if (savedFlow) {
      try {
        const { nodes: savedNodes, edges: savedEdges } = JSON.parse(savedFlow);
        
        // Restore nodes with necessary functions
        const nodesWithFunctions = savedNodes.map(node => ({
          ...node,
          type: 'dialogueNode',  // Ensure node type is set
          data: {
            ...node.data,
            onRemove: handleRemoveNode,
            setNodeData: setNodeData
          }
        }));

        setNodes(nodesWithFunctions);
        setEdges(savedEdges);
      } catch (error) {
        console.error('Error loading saved flow:', error);
      }
    }
  }, [setNodes, setEdges]); // Dependencies for useEffect

  // Move handleRemoveNode before it's used
  const handleRemoveNode = useCallback((idToRemove) => {
    setNodes((nds) => {
      // First, remove the node
      const remainingNodes = nds.filter(node => node.id !== idToRemove);
      
      // Then, reorder the stage numbers starting from 0
      return remainingNodes.map((node, idx) => ({
        ...node,
        data: {
          ...node.data,
          label: `Stage ${idx}`
        }
      }));
    });

    // Remove connected edges
    setEdges((eds) => eds.filter(
      (edge) => edge.source !== idToRemove && edge.target !== idToRemove
    ));
  }, [setNodes, setEdges]);

  // Add setNodeData function
  const setNodeData = useCallback((nodeId, newData) => {
    setNodes(nds => nds.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: newData,
        };
      }
      return node;
    }));
  }, [setNodes]);

  // Update getNodesWithData
  const getNodesWithData = useCallback(() => {
    return nodes.map(node => ({
      ...node,
      data: { 
        ...node.data, 
        onRemove: handleRemoveNode,
        setNodeData: setNodeData
      }
    }));
  }, [nodes, handleRemoveNode, setNodeData]);

  const onConnect = useCallback((params) => {
    if (params.source && params.target) {
      const newEdge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#88ccff' },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#88ccff',
        },
        labelStyle: { fill: 'white', fontWeight: 500 },
        labelBgStyle: { fill: 'rgba(0, 0, 0, 0.75)' },
        labelBgPadding: [8, 4],
        labelBgBorderRadius: 4,
      };
      setEdges((eds) => addEdge(newEdge, eds));
    }
  }, [setEdges]);

  // Add edge removal handler
  const onEdgeDoubleClick = useCallback((event, edge) => {
    event.preventDefault();
    setEdges((eds) => eds.filter((e) => e.id !== edge.id));
  }, [setEdges]);

  // Add edge mouse enter handler for visual feedback
  const onEdgeMouseEnter = useCallback((event, edge) => {
    setEdges((eds) => 
      eds.map((e) => ({
        ...e,
        style: {
          ...e.style,
          stroke: e.id === edge.id ? '#ff4444' : '#88ccff',
        },
      }))
    );
  }, [setEdges]);

  // Add edge mouse leave handler to reset style
  const onEdgeMouseLeave = useCallback((event, edge) => {
    setEdges((eds) => 
      eds.map((e) => ({
        ...e,
        style: {
          ...e.style,
          stroke: '#88ccff',
        },
      }))
    );
  }, [setEdges]);

  const handleAddNode = useCallback(() => {
    const getNextStageNumber = () => {
      const currentNumbers = nodes
        .map(node => {
          const match = node.data.label.match(/Stage (\d+)/);
          return match ? parseInt(match[1]) : -1;
        })
        .sort((a, b) => a - b);

      let nextNumber = 0;
      for (const num of currentNumbers) {
        if (num === nextNumber) {
          nextNumber++;
        } else if (num > nextNumber) {
          break;
        }
      }
      return nextNumber;
    };

    const newNode = {
      id: `${nodes.length + 1}`,
      type: 'dialogueNode',
      position: { 
        x: Math.random() * 500, 
        y: Math.random() * 500 
      },
      data: {
        label: `Stage ${getNextStageNumber()}`,
        dialogue: [],
        choices: [],
        effect: '',
        openFunction: '',
        onComplete: ''
      },
    };

    setNodes((nds) => [...nds, newNode]);
  }, [nodes, setNodes]);

  const handleSave = useCallback(() => {
    const nodeData = nodes.map(node => ({
      id: node.id,
      position: node.position,
      data: {
        label: node.data.label,
        dialogue: node.data.dialogue,
        choices: node.data.choices,
        effects: node.data.effects || [],
        openFunction: node.data.openFunction,
        functionData: node.data.functionData,
        onComplete: node.data.onComplete,
        onCompleteData: node.data.onCompleteData
      }
    }));

    const edgeData = edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle
    }));

    const flowData = {
      nodes: nodeData,
      edges: edgeData
    };

    try {
      localStorage.setItem('onionWorldFlow', JSON.stringify(flowData));
      
      // Update toast position to bottom-left
      toast({
        title: "Flow Saved",
        description: "Your flow has been saved successfully",
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "bottom-left",
      });
    } catch (error) {
      // Error toast also at bottom-left
      toast({
        title: "Save Failed",
        description: "There was an error saving your flow",
        status: "error",
        duration: 2000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  }, [nodes, edges, toast]);

  const handleExport = useCallback(() => {
    const convertToExportFormat = () => {
      const nodeStageMap = new Map(
        nodes
          .sort((a, b) => {
            const aNum = parseInt(a.data.label.match(/\d+/)[0]);
            const bNum = parseInt(b.data.label.match(/\d+/)[0]);
            return aNum - bNum;
          })
          .map((node, index) => [node.id, index])
      );

      const stages = nodes
        .sort((a, b) => {
          const aNum = parseInt(a.data.label.match(/\d+/)[0]);
          const bNum = parseInt(b.data.label.match(/\d+/)[0]);
          return aNum - bNum;
        })
        .map(node => {
          const stage = {
            message: node.data.dialogue.map(d => ({
              text: d.text || '',
              text_translate: d.translation || '',
              audio: d.audioFileName && selectedSpeaker ? 
                `https://smedia.stepup.edu.vn/thecoach/onionworld/audio/x/${selectedSpeaker.voice_id}/${d.audioFileName}` : 
                ''
            })),
            choices: node.data.choices.map((choice, choiceIndex) => {
              const edge = edges.find(e => 
                e.source === node.id && 
                e.sourceHandle === `choice-${choiceIndex}`
              );
              
              const nextStage = edge ? nodeStageMap.get(edge.target) : null;

              return {
                text: choice.text || '',
                image: choice.link || null,
                nextStage: nextStage
              };
            })
          };

          // Convert effects array to object format
          if (Array.isArray(node.data.effects) && node.data.effects.length > 0) {
            stage.effects = node.data.effects.reduce((obj, effect) => {
              if (effect.key) {  // Only include effects with a key
                obj[effect.key] = effect.value;
              }
              return obj;
            }, {});
          }

          // Add function-specific properties
          if (node.data.openFunction) {
            stage.open_function = node.data.openFunction.toLowerCase();
            
            if (node.data.openFunction === 'Asr') {
              stage.asr_text = node.data.functionData?.asr || '';
              stage.score = parseInt(node.data.functionData?.score) || 0;
            }
          }

          // Add onComplete if present
          if (node.data.onComplete) {
            stage.onComplete = node.data.onComplete.toLowerCase();
          }

          // Find any edge from the bottom handle
          const bottomEdge = edges.find(e => 
            e.source === node.id && 
            e.sourceHandle === 'source'
          );

          // Set nextStage if there's a bottom connection
          if (bottomEdge) {
            stage.nextStage = nodeStageMap.get(bottomEdge.target);
          } else {
            stage.nextStage = null;
          }

          return stage;
        });

      return {
        conditions: [
          {
            condition: "default",
            stages: stages
          }
        ]
      };
    };

    const exportData = convertToExportFormat();
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'onion-world-flow.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [nodes, edges, selectedSpeaker]);

  const handlePreviewOpen = () => {
    setIsPreviewOpen(true);
  };

  const handlePreviewClose = () => {
    setIsPreviewOpen(false);
  };

  const handleStartPreview = () => {
    if (!isPlaying) {
      const sortedNodes = getSortedNodes();
      setCurrentNodeIndex(0);
      setCurrentNode(sortedNodes[0]);
      setCurrentDialogueIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleNextDialogue = () => {
    const dialogues = currentNode.data.dialogue;
    if (currentDialogueIndex < dialogues.length - 1) {
      // If not the last dialogue, move to next dialogue
      setCurrentDialogueIndex(currentDialogueIndex + 1);
    } else {
      // If last dialogue
      if (!currentNode.data.choices?.length) {
        // If no choices, find the next node via bottom edge
        const bottomEdge = edges.find(e => 
          e.source === currentNode.id && 
          e.sourceHandle === 'source'
        );

        if (bottomEdge) {
          const nextNode = nodes.find(node => node.id === bottomEdge.target);
          if (nextNode) {
            setCurrentNode(nextNode);
            setCurrentDialogueIndex(0); // Reset to first dialogue of new node
          }
        }
      }
      // If has choices, do nothing (let user select a choice)
    }
  };

  const handleChoiceClick = (choiceIndex) => {
    // Tìm edge tương ứng với choice được chọn
    const edge = edges.find(e => 
      e.source === currentNode.id && 
      e.sourceHandle === `choice-${choiceIndex}`
    );

    if (edge) {
      // Tìm node tiếp theo dựa trên target của edge
      const nextNode = nodes.find(node => node.id === edge.target);
      if (nextNode) {
        setCurrentNode(nextNode);
        setCurrentDialogueIndex(0); // Reset về dialogue đầu tiên của node mới
      }
    }
  };

  const renderNodeContent = () => {
    if (!currentNode || !isPlaying) return null;

    const currentDialogue = currentNode.data.dialogue[currentDialogueIndex];
    const isLastDialogue = currentDialogueIndex === currentNode.data.dialogue.length - 1;
    const hasChoices = currentNode.data.choices?.length > 0;
    const hasNextNode = edges.some(e => 
      e.source === currentNode.id && 
      e.sourceHandle === 'source'
    );

    return (
      <VStack spacing={4} align="stretch" w="100%">
        <Box borderWidth="1px" borderRadius="lg" p={4}>
          <Text fontWeight="bold" mb={2}>Stage: {currentNode.data.label}</Text>
          
          {/* Display Current Dialogue */}
          <Box p={3} borderRadius="md">
            <Text>English: {typeof currentDialogue === 'string' ? currentDialogue : currentDialogue?.text}</Text>
            <Text>Vietnamese: {typeof currentDialogue === 'string' ? '' : currentDialogue?.translation}</Text>
            {currentDialogue?.audio && (
              <Button
                size="sm"
                leftIcon={<FaPlay />}
                mt={2}
                onClick={() => {
                  const audio = new Audio(currentDialogue.audio);
                  audio.play();
                }}
              >
                Play Audio
              </Button>
            )}
          </Box>

          {/* Next Button - Show if not last dialogue OR if last dialogue with no choices but has next node */}
          {(!isLastDialogue || (!hasChoices && hasNextNode)) && (
            <Button
              mt={4}
              colorScheme="blue"
              onClick={handleNextDialogue}
            >
              Next
            </Button>
          )}

          {/* Show "Đã kết thúc" when it's the last dialogue without choices and no next node */}
          {isLastDialogue && !hasChoices && !hasNextNode && (
            <Text mt={4} fontWeight="bold" color="red.500">
              Đã kết thúc
            </Text>
          )}

          {/* Show Choices only on last dialogue */}
          {isLastDialogue && hasChoices && (
            <Box mt={4}>
              <Text fontWeight="bold" mb={2}>Choices:</Text>
              <VStack align="stretch">
                {currentNode.data.choices.map((choice, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    colorScheme="teal"
                    onClick={() => handleChoiceClick(index)}
                  >
                    {choice.text}
                  </Button>
                ))}
              </VStack>
            </Box>
          )}
        </Box>
      </VStack>
    );
  };

  const handleImport = useCallback(() => {
    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target.result);
          
          // Validate imported data structure
          if (!importedData.conditions?.[0]?.stages) {
            throw new Error('Invalid JSON format');
          }
          
          const stages = importedData.conditions[0].stages;
          
          // Convert stages to nodes and edges
          const newNodes = stages.map((stage, index) => ({
            id: `${index + 1}`,
            type: 'dialogueNode',
            position: { x: 250 * (index % 3), y: 200 * Math.floor(index / 3) },
            data: {
              label: `Stage ${index}`,
              dialogue: stage.message.map(msg => ({
                text: msg.text || '',
                translation: msg.text_translate || '',
                audio: msg.audio || ''
              })),
              choices: stage.choices?.map(choice => ({
                text: choice.text || '',
                link: choice.image || ''
              })) || [],
              effects: Object.entries(stage.effects || {}).map(([key, value]) => ({
                key,
                value
              })),
              openFunction: stage.open_function?.toUpperCase() || '',
              functionData: stage.open_function === 'asr' ? {
                asr: stage.asr_text || '',
                score: stage.score || 0
              } : {},
              onComplete: stage.onComplete?.toUpperCase() || ''
            }
          }));

          // Create edges based on choices and nextStage
          const newEdges = stages.flatMap((stage, index) => {
            const edges = [];
            
            // Add edges for choices
            stage.choices?.forEach((choice, choiceIndex) => {
              if (typeof choice.nextStage === 'number') {
                edges.push({
                  id: `e${index}-${choiceIndex}`,
                  source: `${index + 1}`,
                  target: `${choice.nextStage + 1}`,
                  sourceHandle: `choice-${choiceIndex}`,
                  targetHandle: 'target',
                  type: 'smoothstep',
                  animated: true,
                  style: { stroke: '#88ccff' }
                });
              }
            });

            // Add edge for nextStage if it exists
            if (typeof stage.nextStage === 'number') {
              edges.push({
                id: `e${index}-next`,
                source: `${index + 1}`,
                target: `${stage.nextStage + 1}`,
                sourceHandle: 'source',
                targetHandle: 'target',
                type: 'smoothstep',
                animated: true,
                style: { stroke: '#88ccff' }
              });
            }

            return edges;
          });

          setNodes(newNodes);
          setEdges(newEdges);

          toast({
            title: "Import Successful",
            description: "Flow has been imported successfully",
            status: "success",
            duration: 2000,
            isClosable: true,
            position: "bottom-left",
          });

        } catch (error) {
          console.error('Import error:', error);
          toast({
            title: "Import Failed",
            description: "Failed to import JSON file. Please check the file format.",
            status: "error",
            duration: 2000,
            isClosable: true,
            position: "bottom-left",
          });
        }
      };

      reader.readAsText(file);
    };

    input.click();
  }, [setNodes, setEdges, toast]);

  return (
    <Box h="100vh" mt={10}>
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        mb={4}
        position="relative"
        paddingLeft={10}
        marginLeft={7}
        zIndex={1}
        top={'84px'}
      >
        <HStack spacing={4}>
          <Button 
            onClick={handleAddNode}
            colorScheme="blue"
            size="sm"
          >
            Add Node
          </Button>
          <Button
            onClick={handleSave}
            colorScheme="green"
            size="sm"
          >
            Save Flow
          </Button>
          <Button
            onClick={handleExport}
            colorScheme="purple"
            size="sm"
          >
            Export JSON
          </Button>
          <Button
            onClick={handleImport}
            colorScheme="purple"
            variant="outline"
            size="sm"
          >
            Import JSON
          </Button>
          <Button
            onClick={onOpen}
            colorScheme="teal"
            size="sm"
          >
            Text to Speech
          </Button>
        </HStack>
        <Button
          colorScheme="orange"
          size="sm"
          marginRight={10}
          onClick={handlePreviewOpen}
        >
          Preview
        </Button>
      </Box>

      <Drawer
        isOpen={isPreviewOpen}
        placement="right"
        onClose={handlePreviewClose}
        size="md"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Preview</DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="stretch">
              <ButtonGroup>
                <Button
                  size="lg"
                  colorScheme="green"
                  onClick={handleStartPreview}
                  leftIcon={isPlaying ? <FaStop /> : <FaPlay />}
                >
                  {isPlaying ? 'Restart' : 'Start'}
                </Button>
              </ButtonGroup>
              
              {renderNodeContent()}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      <div style={{ height: 'calc(100vh - 100px)' }}>
        <ReactFlow
          nodes={getNodesWithData()}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeDoubleClick={onEdgeDoubleClick}
          onEdgeMouseEnter={onEdgeMouseEnter}
          onEdgeMouseLeave={onEdgeMouseLeave}
          nodeTypes={nodeTypes}
          fitView
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#88ccff' }
          }}
        >
          <Background variant="dots" gap={12} size={1} />
          <Controls />
          {/* Add edge removal instructions */}
          <div className="edge-instructions">
            Double-click an edge to remove it
          </div>
        </ReactFlow>
      </div>
      <SpeakerModal isOpen={isOpen} onClose={onClose} nodes={nodes} setNodes={setNodes} onSpeakerSelect={setSelectedSpeaker} />
    </Box>
  );
};

export default OnionWorld; 