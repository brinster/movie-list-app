// src/pages/SearchMoviesPage.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  Input, Button, Box, HStack, Image, Text, SimpleGrid,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
  ModalBody, ModalCloseButton, Select, useDisclosure, VStack,
} from "@chakra-ui/react";
import PosterCollage from "../components/PosterCollage";

const boxStyle = {
  boxShadow: "0 1px 0 rgba(255,255,255,0.06) inset, 0 4px 24px rgba(0,0,0,0.35)",
  borderTop: "1px solid rgba(255,255,255,0.08)",
};

export default function SearchMoviesPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [movies, setMovies] = useState([]);
  const [format, setFormat] = useState("");
  const [studio, setStudio] = useState("");
  const [type, setType] = useState("");

  const { isOpen, onOpen, onClose } = useDisclosure();

  const typeOptions = ["Box Set", "Special Edition", "Steelbook"];
  const formatOptions = ["4K + BD", "4K", "BD", "DVD"];
  const studioOptions = [
    "A24", "Arrow", "Criterion", "Kino Lorber", "Lionsgate",
    "Paramount", "Shout!", "Sony", "Universal", "Warner Bros",
  ];

  useEffect(() => {
    const fetchMovies = async () => {
      const { data } = await supabase.from("movies").select("poster_url, added_at");
      setMovies(data || []);
    };
    fetchMovies();
  }, []);

  const searchMovies = async () => {
    if (!query) return;
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${process.env.REACT_APP_TMDB_KEY}&query=${encodeURIComponent(query)}`
      );
      if (!res.ok) return;
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const openAddModal = (movie) => {
    setSelectedMovie(movie);
    setFormat(""); setStudio(""); setType("");
    onOpen();
  };

  const addMovie = async () => {
    if (!selectedMovie) return;
    const { error } = await supabase.from("movies").insert({
      tmdb_id: parseInt(selectedMovie.id),
      title: selectedMovie.title,
      year: selectedMovie.release_date ? selectedMovie.release_date.split("-")[0] : null,
      poster_url: selectedMovie.poster_path ? `https://image.tmdb.org/t/p/w200${selectedMovie.poster_path}` : null,
      format: format || null,
      studio: studio || null,
      type: type || null,
    });
    if (error) { console.error(error); alert("Failed to add movie."); }
    else { alert(`${selectedMovie.title} added!`); onClose(); }
  };

  const selectStyle = {
    bg: "gray.700",
    border: "1px solid",
    borderColor: "whiteAlpha.100",
    borderRadius: "8px",
    color: "white",
    fontSize: "13px",
    _focus: { borderColor: "teal.400", boxShadow: "0 0 0 1px var(--chakra-colors-teal-400)" },
  };

  return (
    <Box position="relative" zIndex={1} isolation="isolate">
      <PosterCollage movies={movies} />

      {/* Search bar */}
      <Box
        bg="gray.800"
        borderRadius="12px"
        p={4}
        mb={3}
        position="relative"
        zIndex={2}
        style={boxStyle}
      >
        <HStack spacing={3}>
          <Input
            placeholder="Search for a movie..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") searchMovies(); }}
            bg="gray.700"
            border="1px solid"
            borderColor="whiteAlpha.100"
            borderRadius="8px"
            color="white"
            fontSize="14px"
            h="38px"
            _placeholder={{ color: "whiteAlpha.400" }}
            _focus={{ borderColor: "teal.400", boxShadow: "0 0 0 1px var(--chakra-colors-teal-400)" }}
          />
          <Button
            onClick={searchMovies}
            flexShrink={0}
            bg="teal.500"
            color="white"
            borderRadius="8px"
            fontWeight="600"
            fontSize="13px"
            h="38px"
            px={5}
            border="1px solid"
            borderColor="teal.400"
            _hover={{ bg: "teal.400", transform: "translateY(-1px)", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}
            _active={{ transform: "translateY(0)" }}
            transition="all 0.15s ease"
          >
            Search
          </Button>
        </HStack>
      </Box>

      {/* Results */}
      {results.length > 0 && (
        <Box
          bg="gray.800"
          borderRadius="12px"
          p={4}
          position="relative"
          zIndex={2}
          style={boxStyle}
        >
          <Text fontSize="11px" fontWeight="700" letterSpacing="0.12em" textTransform="uppercase" color="whiteAlpha.400" mb={3}>
            {results.length} Results
          </Text>
          <SimpleGrid columns={[2, 3, 4]} spacing={3}>
            {results.map((m) => (
              <Box
                key={m.id}
                onClick={() => openAddModal(m)}
                cursor="pointer"
                borderRadius="8px"
                overflow="hidden"
                bg="gray.700"
                border="1px solid"
                borderColor="whiteAlpha.100"
                transition="all 0.15s ease"
                _hover={{
                  transform: "translateY(-3px)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                  borderColor: "teal.500",
                }}
              >
                {m.poster_path ? (
                  <>
                    <Image
                      src={`https://image.tmdb.org/t/p/w200${m.poster_path}`}
                      alt={m.title}
                      w="100%"
                      display="block"
                    />
                    <Box p={2}>
                      <Text fontSize="12px" fontWeight="600" color="white" noOfLines={2} lineHeight="1.35">{m.title}</Text>
                      <Text fontSize="11px" color="whiteAlpha.400" mt="2px">{m.release_date?.split("-")[0] || "N/A"}</Text>
                    </Box>
                  </>
                ) : (
                  <Box p={3} h="160px" display="flex" flexDirection="column" justifyContent="flex-end">
                    <Text fontSize="12px" fontWeight="600" color="white" noOfLines={3} lineHeight="1.35">{m.title}</Text>
                    <Text fontSize="11px" color="whiteAlpha.400" mt="2px">{m.release_date?.split("-")[0] || "N/A"}</Text>
                  </Box>
                )}
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      )}

      {/* Add Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(6px)" />
        <ModalContent
          bg="gray.800"
          border="1px solid"
          borderColor="whiteAlpha.100"
          borderRadius="12px"
          color="white"
          style={boxStyle}
        >
          <ModalHeader pb={3} borderBottom="1px solid" borderColor="whiteAlpha.100">
            <Text fontSize="15px" fontWeight="700" color="white">{selectedMovie?.title}</Text>
            <Text fontSize="12px" color="whiteAlpha.400" fontWeight="400" mt="2px">
              {selectedMovie?.release_date?.split("-")[0]} · Choose details to save
            </Text>
          </ModalHeader>
          <ModalCloseButton color="whiteAlpha.500" _hover={{ color: "white" }} />
          <ModalBody py={5}>
            <VStack spacing={3}>
              {[
                { placeholder: "Format", value: format, onChange: setFormat, options: formatOptions },
                { placeholder: "Studio (optional)", value: studio, onChange: setStudio, options: studioOptions },
                { placeholder: "Type (optional)", value: type, onChange: setType, options: typeOptions },
              ].map(({ placeholder, value, onChange, options }) => (
                <Select
                  key={placeholder}
                  placeholder={placeholder}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  h="38px"
                  {...selectStyle}
                >
                  {options.map((opt) => <option key={opt} style={{ background: "#2d3748" }}>{opt}</option>)}
                </Select>
              ))}
            </VStack>
          </ModalBody>
          <ModalFooter borderTop="1px solid" borderColor="whiteAlpha.100" gap={2}>
            <Button
              onClick={addMovie}
              bg="teal.500"
              color="white"
              borderRadius="8px"
              fontWeight="600"
              fontSize="13px"
              border="1px solid"
              borderColor="teal.400"
              _hover={{ bg: "teal.400" }}
              transition="all 0.15s"
            >
              Add to Library
            </Button>
            <Button
              onClick={onClose}
              bg="gray.700"
              color="whiteAlpha.700"
              borderRadius="8px"
              fontWeight="500"
              fontSize="13px"
              border="1px solid"
              borderColor="whiteAlpha.100"
              _hover={{ bg: "gray.600", color: "white" }}
              transition="all 0.15s"
            >
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
