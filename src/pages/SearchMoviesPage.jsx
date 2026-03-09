import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  Input, Button, Box, HStack, Image, Text, SimpleGrid,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
  ModalBody, ModalCloseButton, Select, useDisclosure, VStack,
  useToast, Divider, Checkbox
} from "@chakra-ui/react";
import PosterCollage from "../components/PosterCollage";

export default function SearchMoviesPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [movies, setMovies] = useState([]);
  const [isAdding, setIsAdding] = useState(false);

  // Collection State
  const [existingCollections, setExistingCollections] = useState([]);
  const [isNewCollection, setIsNewCollection] = useState(false);

  // Form States
  const [format, setFormat] = useState("");
  const [studio, setStudio] = useState("");
  const [type, setType] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [watchTogether, setWatchTogether] = useState(null);
  const [sr, setSr] = useState(null);
  const [jr, setJr] = useState(null);
  const [location, setLocation] = useState(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const typeOptions = ["Steelbook", "Box Set", "Special Edition"];
  const formatOptions = ["4K + BD", "4K", "BD", "DVD"];
  const studioOptions = ["A24", "Arrow", "Criterion", "Kino Lorber", "Lionsgate", "Neon", "Paramount", "Shout!", "Sony", "Universal", "Warner Bros"];

  useEffect(() => {
    fetchMovies();
    fetchCollections();
  }, []);

  const fetchMovies = async () => {
    const { data } = await supabase.from("movies").select("poster_url, added_at");
    setMovies(data || []);
  };

  const fetchCollections = async () => {
    const { data } = await supabase.from("movies").select("collection_name").not("collection_name", "is", null);
    const uniqueNames = [...new Set(data.map((item) => item.collection_name))];
    setExistingCollections(uniqueNames.sort());
  };

  const searchMovies = async () => {
    if (!query) return;
    const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${process.env.REACT_APP_TMDB_KEY}&query=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResults(data.results || []);
  };

  const openAddModal = (movie) => {
    setSelectedMovie(movie);
    // Persist settings only if "Box Set" is currently active
    if (type !== "Box Set") {
      setFormat("");
      setStudio("");
      setType("");
      setCollectionName("");
      setWatchTogether(null);
      setSr(null);
      setJr(null);
      setLocation(null);
      setIsNewCollection(false);
    }
    onOpen();
  };

  const resetForm = () => {
    setFormat("");
    setStudio("");
    setType("");
    setCollectionName("");
    setWatchTogether(null);
    setSr(null);
    setJr(null);
    setLocation(null);
    setIsNewCollection(false);
    toast({ title: "Form Reset", status: "info", duration: 2000, position: "top" });
  };

  const handleWatchCycle = () => {
    let nextState;
    if (watchTogether === null) nextState = "yes";
    else if (watchTogether === "yes") {
      nextState = "completed";
      setSr("watched");
      setJr("watched");
    } else nextState = null;
    setWatchTogether(nextState);
  };

  const addMovie = async () => {
    if (!selectedMovie) return;
    setIsAdding(true);

    const { error } = await supabase.from("movies").insert({
      tmdb_id: parseInt(selectedMovie.id),
      title: selectedMovie.title,
      year: selectedMovie.release_date ? selectedMovie.release_date.split("-")[0] : null,
      poster_url: selectedMovie.poster_path ? `https://image.tmdb.org/t/p/w200${selectedMovie.poster_path}` : null,
      format: format || null,
      studio: studio || null,
      type: type || null,
      collection_name: type === "Box Set" ? collectionName : null,
      watch_together: watchTogether,
      sr: sr,
      jr: jr,
      location: location,
    });

    if (error) {
      toast({ title: "Error adding movie", description: error.message, status: "error", position: "top" });
    } else {
      fetchMovies();
      fetchCollections();
      toast({
        title: "Movie Added!",
        description: `${selectedMovie.title} added successfully.`,
        status: "success",
        duration: 2000,
        position: "top",
      });
      onClose();
    }
    setIsAdding(false);
  };

  const selectStyle = { bg: "gray.700", border: "1px solid", borderColor: "whiteAlpha.100", color: "white" };

  return (
    <Box position="relative" zIndex={1}>
      <PosterCollage movies={movies} />

      <Box bg="gray.800" borderRadius="12px" p={4} mb={3} boxShadow="0 4px 24px rgba(0,0,0,0.35)">
        <VStack align="stretch" spacing={3}>
          <HStack spacing={3}>
            <Input
              placeholder="Search TMDB for movies..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchMovies()}
              bg="gray.700" color="white" border="1px solid" borderColor="whiteAlpha.200"
            />
            <Button onClick={searchMovies} colorScheme="teal" px={8}>Search</Button>
          </HStack>
          
          {(type === "Box Set" || format || studio) && (
            <HStack justify="space-between" bg="whiteAlpha.50" p={2} borderRadius="md" border="1px dashed" borderColor="whiteAlpha.200">
              <Text fontSize="11px" color="teal.300" fontWeight="bold">
                ACTIVE SETTINGS: {type === "Box Set" ? `📦 ${collectionName || "Unnamed Box Set"}` : "Single Movie"} | {format} | {studio}
              </Text>
              <Button size="xs" variant="ghost" colorScheme="orange" onClick={resetForm}>Clear All</Button>
            </HStack>
          )}
        </VStack>
      </Box>

      {results.length > 0 && (
        <Box bg="gray.800" borderRadius="12px" p={4} boxShadow="0 4px 24px rgba(0,0,0,0.35)">
          <SimpleGrid columns={[2, 3, 4, 5]} spacing={3}>
            {results.map((m) => (
              <Box
                key={m.id}
                onClick={() => openAddModal(m)}
                cursor="pointer" bg="gray.700" borderRadius="8px" overflow="hidden"
                transition="all 0.2s" border="1px solid" borderColor="whiteAlpha.100"
                _hover={{ transform: "translateY(-4px)", borderColor: "teal.500" }}
              >
                <Image src={`https://image.tmdb.org/t/p/w200${m.poster_path}`} fallbackSrc="https://via.placeholder.com/200x300?text=No+Poster" />
                <Box p={2}>
                  <Text fontSize="12px" fontWeight="600" color="white" noOfLines={1}>{m.title}</Text>
                  <Text fontSize="10px" color="whiteAlpha.500">{m.release_date?.split("-")[0]}</Text>
                </Box>
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      )}

      <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
        <ModalOverlay backdropFilter="blur(8px)" bg="blackAlpha.700" />
        <ModalContent bg="gray.800" color="white" borderRadius="16px" border="1px solid" borderColor="whiteAlpha.100">
          <ModalHeader pb={1}>{selectedMovie?.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              
              {/* 1. Format and Studio at the top */}
              <HStack>
                <Box flex={1}>
                  <Text fontSize="xs" color="whiteAlpha.500" mb={1}>Format</Text>
                  <Select placeholder="Format" value={format} onChange={(e) => setFormat(e.target.value)} {...selectStyle}>
                    {formatOptions.map(o => <option key={o} style={{ background: "#2d3748" }}>{o}</option>)}
                  </Select>
                </Box>
                <Box flex={1}>
                  <Text fontSize="xs" color="whiteAlpha.500" mb={1}>Studio</Text>
                  <Select placeholder="Studio" value={studio} onChange={(e) => setStudio(e.target.value)} {...selectStyle}>
                    {studioOptions.map(o => <option key={o} style={{ background: "#2d3748" }}>{o}</option>)}
                  </Select>
                </Box>
              </HStack>

              <Divider borderColor="whiteAlpha.100" />

              {/* 2. Type and Collection Logic */}
              <Box>
                <Text fontSize="xs" color="whiteAlpha.500" mb={1}>Entry Type</Text>
                <Select placeholder="Select Type" value={type} onChange={(e) => setType(e.target.value)} {...selectStyle}>
                  {typeOptions.map(o => <option key={o} style={{ background: "#2d3748" }}>{o}</option>)}
                </Select>
              </Box>

              {type === "Box Set" && (
                <Box p={3} bg="whiteAlpha.50" borderRadius="md" border="1px solid" borderColor="teal.600">
                  <VStack align="stretch" spacing={2}>
                    <Checkbox size="sm" colorScheme="teal" isChecked={isNewCollection} onChange={(e) => {
                      setIsNewCollection(e.target.checked);
                      if (e.target.checked) setCollectionName("");
                    }}>
                      New Box Set Name
                    </Checkbox>

                    {isNewCollection ? (
                      <Input
                        placeholder="e.g. Marvel Cinematic Universe"
                        value={collectionName}
                        onChange={(e) => setCollectionName(e.target.value)}
                        bg="gray.900" border="1px solid" borderColor="teal.500" fontSize="sm"
                      />
                    ) : (
                      <Select
                        placeholder="Select Existing Set"
                        value={collectionName}
                        onChange={(e) => setCollectionName(e.target.value)}
                        {...selectStyle}
                      >
                        {existingCollections.map(name => <option key={name} value={name} style={{ background: "#2d3748" }}>{name}</option>)}
                      </Select>
                    )}
                  </VStack>
                </Box>
              )}

              <Divider borderColor="whiteAlpha.100" />

              {/* 3. Status Section at the bottom */}
              <Box>
                <Text fontSize="10px" fontWeight="800" mb={2} letterSpacing="0.1em" textTransform="uppercase" color="whiteAlpha.400">Status</Text>
                <HStack spacing={2}>
                  <Button size="sm" flex={1} onClick={handleWatchCycle} border="1px solid" bg={watchTogether === "yes" ? "yellow.900" : watchTogether === "completed" ? "green.900" : "transparent"} color={watchTogether === "yes" ? "yellow.300" : watchTogether === "completed" ? "green.300" : "whiteAlpha.400"} borderColor={watchTogether === "yes" ? "yellow.700" : watchTogether === "completed" ? "green.700" : "whiteAlpha.100"}>
                    {watchTogether === "completed" ? "✓ 👀" : "👀"}
                  </Button>
                  <Button size="sm" flex={1} onClick={() => setSr(sr === "watched" ? null : "watched")} border="1px solid" bg={sr === "watched" ? "purple.900" : "transparent"} color={sr === "watched" ? "purple.300" : "whiteAlpha.400"} borderColor={sr === "watched" ? "purple.700" : "whiteAlpha.100"}>
                    {sr === "watched" ? "✓ Sr" : "Sr"}
                  </Button>
                  <Button size="sm" flex={1} onClick={() => setJr(jr === "watched" ? null : "watched")} border="1px solid" bg={jr === "watched" ? "blue.900" : "transparent"} color={jr === "watched" ? "blue.300" : "whiteAlpha.400"} borderColor={jr === "watched" ? "blue.700" : "whiteAlpha.100"}>
                    {jr === "watched" ? "✓ Jr" : "Jr"}
                  </Button>
                  <Button size="sm" flex={1} onClick={() => setLocation(location === "Sr" ? "Jr" : location === "Jr" ? null : "Sr")} border="1px solid" bg={location === "Sr" ? "purple.900" : location === "Jr" ? "blue.900" : "transparent"} color={location === "Sr" ? "purple.300" : location === "Jr" ? "blue.300" : "whiteAlpha.400"} borderColor={location === "Sr" ? "purple.700" : location === "Jr" ? "blue.700" : "whiteAlpha.100"}>
                    📍{location || ""}
                  </Button>
                </HStack>
              </Box>

            </VStack>
          </ModalBody>
          <ModalFooter pb={6}>
            <Button colorScheme="teal" w="full" onClick={addMovie} isLoading={isAdding}>
              Add Movie
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}