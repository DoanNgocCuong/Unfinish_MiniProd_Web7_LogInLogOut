import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  Textarea,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  Select,
  useToast,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  IconButton
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { FaPlay } from 'react-icons/fa';
import { DownloadIcon } from '@chakra-ui/icons';
import { utils as xlsxUtils, write as xlsxWrite } from 'xlsx';
import { saveAs } from 'file-saver';

const VOICE_OPTIONS = {
  NONE: { value: 'None', color: 'gray.500' },
  ABNORMAL: { value: 'Bất thường', color: 'pink.500' },
  OK: { value: 'Ok', color: 'green.500' }
};

const VoiceSelect = ({ value, onChange, ...props }) => {
  const getColor = (optionValue) => {
    return Object.values(VOICE_OPTIONS).find(opt => opt.value === optionValue)?.color || 'gray.500';
  };

  return (
    <Select
      value={value}
      onChange={onChange}
      color={getColor(value)}
      fontWeight="500"
      width="120px"
      {...props}
    >
      <option style={{ color: VOICE_OPTIONS.NONE.color }} value={VOICE_OPTIONS.NONE.value}>
        {VOICE_OPTIONS.NONE.value}
      </option>
      <option style={{ color: VOICE_OPTIONS.ABNORMAL.color }} value={VOICE_OPTIONS.ABNORMAL.value}>
        {VOICE_OPTIONS.ABNORMAL.value}
      </option>
      <option style={{ color: VOICE_OPTIONS.OK.color }} value={VOICE_OPTIONS.OK.value}>
        {VOICE_OPTIONS.OK.value}
      </option>
    </Select>
  );
};

const QCTTS = () => {
  const [inputText, setInputText] = useState(() => {
    const savedText = localStorage.getItem('qcttsInputText');
    return savedText || '';
  });
  const [tableData, setTableData] = useState(() => {
    const savedData = localStorage.getItem('qcttsTableData');
    return savedData ? JSON.parse(savedData) : [];
  });
  const [tableName, setTableName] = useState(() => {
    const savedName = localStorage.getItem('qcttsTableName');
    return savedName || 'QC TTS';
  });
  const [columnTitles, setColumnTitles] = useState({
    id: 'ID',
    paragraph: 'Paragraph',
    voice_linh_v1: 'Voice linh_v1',
    wrong_word_linh: 'Wrong word',
    note_linh_v1: 'Note linh_v1',
    voice_ha_v3: 'Voice ha_v3',
    wrong_word_ha: 'Wrong word',
    note_ha_v3: 'Note ha_v3'
  });
  const [editingColumn, setEditingColumn] = useState(null);
  const [audioUrlsLinhV1, setAudioUrlsLinhV1] = useState(() => {
    const savedUrls = localStorage.getItem('qcttsAudioUrlsLinhV1');
    return savedUrls ? JSON.parse(savedUrls) : {};
  });
  const [audioUrlsHaV3, setAudioUrlsHaV3] = useState(() => {
    const savedUrls = localStorage.getItem('qcttsAudioUrlsHaV3');
    return savedUrls ? JSON.parse(savedUrls) : {};
  });
  const [isVoiceMenuOpen, setIsVoiceMenuOpen] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const toast = useToast();

  const voices = [
    { id: 'linh_v1', name: 'Linh V1' },
    { id: 'ha_v3', name: 'Ha V3' }
  ];

  const generateSpeech = async (text, voice) => {
    try {
      const response = await fetch('https://tts-prod.hacknao.edu.vn/api/v1/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voice,
          text,
          token: 'iaKglGRsR8wlzx5hEcJJ3U2GlgaaMIqA',
          format: 'mp3',
          source: 'tc_ll',
          support_caching: 'false',
          speed: 1
        }),
      });

      const data = await response.json();
      if (data.status === 0 && data.data.audio_url) {
        return data.data.audio_url;
      } else {
        throw new Error(data.msg || 'Failed to generate speech');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return null;
    }
  };

  const handleGenerateVoice = async (voice, rowId, text) => {
    try {
      const audioUrl = await generateSpeech(text, voice);
      if (audioUrl) {
        if (voice === 'linh_v1') {
          setAudioUrlsLinhV1(prev => ({ ...prev, [rowId]: audioUrl }));
        } else if (voice === 'ha_v3') {
          setAudioUrlsHaV3(prev => ({ ...prev, [rowId]: audioUrl }));
        }
      }
    } catch (error) {
      toast({
        title: 'Error generating audio',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleVoiceSelect = async (voice) => {
    setSelectedVoice(voice);
    setIsVoiceMenuOpen(false);

    const loadingToast = toast({
      title: 'Generating audio...',
      description: 'Please wait while we generate audio for all paragraphs',
      status: 'loading',
      duration: null,
    });

    try {
      const newAudioUrls = {};
      for (const row of tableData) {
        const audioUrl = await generateSpeech(row.paragraph, voice);
        if (audioUrl) {
          newAudioUrls[row.id] = audioUrl;
        }
      }

      if (voice === 'linh_v1') {
        setAudioUrlsLinhV1(newAudioUrls);
      } else if (voice === 'ha_v3') {
        setAudioUrlsHaV3(newAudioUrls);
      }

      toast.close(loadingToast);
      toast({
        title: 'Audio generated successfully',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      toast.close(loadingToast);
      toast({
        title: 'Error generating audio',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleCellChange = (id, field, value) => {
    setTableData(prevData =>
      prevData.map(row =>
        row.id === id ? { ...row, [field]: value } : row
      )
    );
    
    // Clear audio URL when voice selection changes
    if (field === 'voice_linh_v1') {
      setAudioUrlsLinhV1(prev => {
        const newUrls = { ...prev };
        delete newUrls[id];
        return newUrls;
      });
    } else if (field === 'voice_ha_v3') {
      setAudioUrlsHaV3(prev => {
        const newUrls = { ...prev };
        delete newUrls[id];
        return newUrls;
      });
    }
  };

  const handleExportExcel = () => {
    // Convert table data to worksheet format
    const worksheet = xlsxUtils.json_to_sheet(tableData.map(row => ({
      ID: row.id,
      Paragraph: row.paragraph,
      'Voice Linh V1': row.voice_linh_v1,
      'Wrong Words (Linh)': row.wrong_word_linh,
      'Notes (Linh)': row.note_linh_v1,
      'Voice Ha V3': row.voice_ha_v3,
      'Wrong Words (Ha)': row.wrong_word_ha,
      'Notes (Ha)': row.note_ha_v3
    })));

    // Create workbook and append worksheet
    const workbook = {
      Sheets: { 'QC TTS': worksheet },
      SheetNames: ['QC TTS']
    };

    // Generate Excel file
    const excelBuffer = xlsxWrite(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });

    // Save file
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(blob, `${tableName || 'QC TTS'}.xlsx`);
  };

  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputText(text);
    
    // Parse the text into table rows
    const rows = text.split('\n').filter(row => row.trim() !== '');
    
    // Convert rows to table data structure
    const newTableData = rows.map((row, index) => ({
      id: index + 1,
      paragraph: row,
      voice_linh_v1: VOICE_OPTIONS.NONE.value,
      wrong_word_linh: '',
      note_linh_v1: '',
      voice_ha_v3: VOICE_OPTIONS.NONE.value,
      wrong_word_ha: '',
      note_ha_v3: ''
    }));

    // Clear all audio URLs when new text is entered
    setAudioUrlsLinhV1({});
    setAudioUrlsHaV3({});
    setSelectedVoice(null);
    
    setTableData(newTableData);
  };

  const handleColumnTitleChange = (columnKey, newTitle) => {
    setColumnTitles(prev => ({
      ...prev,
      [columnKey]: newTitle
    }));
    setEditingColumn(null);
  };

  const handleTableNameChange = (e) => {
    setTableName(e.target.value);
  };

  useEffect(() => {
    const saveToLocalStorage = () => {
      localStorage.setItem('qcttsTableData', JSON.stringify(tableData));
      localStorage.setItem('qcttsTableName', tableName);
      localStorage.setItem('qcttsAudioUrlsLinhV1', JSON.stringify(audioUrlsLinhV1));
      localStorage.setItem('qcttsAudioUrlsHaV3', JSON.stringify(audioUrlsHaV3));
      localStorage.setItem('qcttsInputText', inputText);
    };

    // Save immediately when data changes
    saveToLocalStorage();

    // Set up auto-save interval
    const intervalId = setInterval(saveToLocalStorage, 10000);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [tableData, tableName, audioUrlsLinhV1, audioUrlsHaV3, inputText]);

  return (
    <Box w="100%" minH="100vh" p={8}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Input
            value={tableName}
            onChange={handleTableNameChange}
            fontSize="2xl"
            fontWeight="bold"
            variant="flushed"
            mb={4}
            color="inherit"
            _dark={{ color: 'white' }}
            _light={{ color: 'gray.800' }}
          />
          <Menu isOpen={isVoiceMenuOpen} onClose={() => setIsVoiceMenuOpen(false)}>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              onClick={() => setIsVoiceMenuOpen(true)}
              colorScheme="blue"
              size="md"
              w="200px"
              mr={4}
            >
              Text to Speech {selectedVoice ? ` - ${selectedVoice}` : ''}
            </MenuButton>
            <MenuList>
              {voices.map(voice => (
                <MenuItem
                  key={voice.id}
                  onClick={() => handleVoiceSelect(voice.id)}
                >
                  {voice.name}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
          <Button
            colorScheme="green"
            size="md"
            onClick={handleExportExcel}
            leftIcon={<DownloadIcon />}
          >
            Export Excel
          </Button>
        </Box>
        <Box overflowX="auto" w="100%" borderWidth="1px" borderRadius="lg">
          <Table variant="simple" size="sm" w="100%">
            <Thead bg="gray.50" _dark={{ bg: 'gray.700' }}>
              <Tr>
                {Object.entries(columnTitles).map(([key, title]) => (
                  <Th 
                    key={key}
                    color="inherit"
                    _dark={{ color: 'white' }}
                    _light={{ color: 'gray.800' }}
                  >
                    {editingColumn === key ? (
                      <Input
                        value={title}
                        onChange={(e) => handleColumnTitleChange(key, e.target.value)}
                        onBlur={() => setEditingColumn(null)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleColumnTitleChange(key, e.target.value);
                          }
                        }}
                        size="sm"
                        autoFocus
                      />
                    ) : (
                      <Box
                        onDoubleClick={() => setEditingColumn(key)}
                        cursor="pointer"
                      >
                        {title}
                      </Box>
                    )}
                  </Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {tableData.length > 0 ? (
                tableData.map(row => (
                  <Tr key={row.id}>
                    <Td width="50px" 
                      color="inherit"
                      _dark={{ color: 'white' }}
                      _light={{ color: 'gray.800' }}
                    >
                      {row.id}
                    </Td>
                    <Td width="300px" maxW="300px" 
                      whiteSpace="pre-wrap"
                      color="inherit"
                      _dark={{ color: 'white' }}
                      _light={{ color: 'gray.800' }}
                    >
                      <Box whiteSpace="pre-wrap">
                        {row.paragraph}
                      </Box>
                    </Td>
                    <Td width="120px" 
                      color="inherit"
                      _dark={{ color: 'white' }}
                      _light={{ color: 'gray.800' }}
                    >
                      <HStack>
                        <VoiceSelect
                          size="sm"
                          value={row.voice_linh_v1}
                          onChange={(e) => handleCellChange(row.id, 'voice_linh_v1', e.target.value)}
                        />
                        {audioUrlsLinhV1[row.id] && (
                          <IconButton
                            icon={<FaPlay />}
                            size="sm"
                            colorScheme="green"
                            aria-label="Play Linh V1"
                            onClick={() => {
                              const audio = new Audio(audioUrlsLinhV1[row.id]);
                              audio.play();
                            }}
                          />
                        )}
                      </HStack>
                    </Td>
                    <Td width="200px" 
                      color="inherit"
                      _dark={{ color: 'white' }}
                      _light={{ color: 'gray.800' }}
                    >
                      <Input
                        size="sm"
                        value={row.wrong_word_linh}
                        onChange={(e) => handleCellChange(row.id, 'wrong_word_linh', e.target.value)}
                        borderColor="gray.300"
                        _hover={{ borderColor: 'gray.400' }}
                        _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)' }}
                      />
                    </Td>
                    <Td width="200px" 
                      color="inherit"
                      _dark={{ color: 'white' }}
                      _light={{ color: 'gray.800' }}
                    >
                      <Input
                        size="sm"
                        value={row.note_linh_v1}
                        onChange={(e) => handleCellChange(row.id, 'note_linh_v1', e.target.value)}
                        borderColor="gray.300"
                        _hover={{ borderColor: 'gray.400' }}
                        _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)' }}
                      />
                    </Td>
                    <Td width="120px" 
                      color="inherit"
                      _dark={{ color: 'white' }}
                      _light={{ color: 'gray.800' }}
                    >
                      <HStack>
                        <VoiceSelect
                          size="sm"
                          value={row.voice_ha_v3}
                          onChange={(e) => handleCellChange(row.id, 'voice_ha_v3', e.target.value)}
                        />
                        {audioUrlsHaV3[row.id] && (
                          <IconButton
                            icon={<FaPlay />}
                            size="sm"
                            colorScheme="green"
                            aria-label="Play Ha V3"
                            onClick={() => {
                              const audio = new Audio(audioUrlsHaV3[row.id]);
                              audio.play();
                            }}
                          />
                        )}
                      </HStack>
                    </Td>
                    <Td width="200px" 
                      color="inherit"
                      _dark={{ color: 'white' }}
                      _light={{ color: 'gray.800' }}
                    >
                      <Input
                        size="sm"
                        value={row.wrong_word_ha}
                        onChange={(e) => handleCellChange(row.id, 'wrong_word_ha', e.target.value)}
                        borderColor="gray.300"
                        _hover={{ borderColor: 'gray.400' }}
                        _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)' }}
                      />
                    </Td>
                    <Td width="200px" 
                      color="inherit"
                      _dark={{ color: 'white' }}
                      _light={{ color: 'gray.800' }}
                    >
                      <Input
                        size="sm"
                        value={row.note_ha_v3}
                        onChange={(e) => handleCellChange(row.id, 'note_ha_v3', e.target.value)}
                        borderColor="gray.300"
                        _hover={{ borderColor: 'gray.400' }}
                        _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)' }}
                      />
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={8} textAlign="center" py={4}>
                    Paste text below to add data to the table
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </Box>
        <Box w="100%">
          <Text mb={2} fontWeight="medium">Paste your text here:</Text>
          <Textarea
            value={inputText}
            onChange={handleInputChange}
            placeholder="Paste your text here..."
            size="sm"
            rows={5}
            mb={4}
            color="inherit"
            _dark={{ color: 'white', borderColor: 'gray.600' }}
            _light={{ color: 'gray.800', borderColor: 'gray.300' }}
          />
        </Box>
      </VStack>
    </Box>
  );
};

export default QCTTS;
