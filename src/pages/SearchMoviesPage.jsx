// src/pages/SearchMoviesPage.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  Input, Button, Box, VStack, HStack, Image, Text, SimpleGrid,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
  ModalBody, ModalCloseButton, Select, useDisclosure,
} from "@chakra-ui/react";
import PosterCollage from "../components/PosterCollage";

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
    const encodedQuery = encodeURIComponent(query);
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${process.env.REACT_APP_TMDB_KEY}&query=${encodedQuery}`
      );
      if (!res.ok) { console.error("TMDB API error", res.status, await res.text()); return; }
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
    const insertData = {
      tmdb_id: parseInt(selectedMovie.id),
      title: selectedMovie.title,
      year: selectedMovie.release_date ? selectedMovie.release_date.split("-")[0] : null,
      poster_url: selectedMovie.poster_path ? `https://image.tmdb.org/t/p/w200${selectedMovie.poster_path}` : null,
      format: format || null,
      studio: studio || null,
      type: type || null,
    };
    const { error } = await supabase.from("movies").insert(insertData);
    if (error) { console.error("Supabase insert error:", error); alert("Failed to add movie. Check console."); }
    else { alert(`${selectedMovie.title} added successfully!`); onClose(); }
  };

  return (
    <Box position="relative" zIndex={1} isolation="isolate">
      <PosterCollage movies={movies} />

      {/* Back button + search bar — opaque, above canvas */}
      <Box bg="gray.800" borderRadius="md" p={3} mb={4} position="relative" zIndex={2}>
        <VStack spacing={3} align="stretch">
          <HStack>
            <Input
              placeholder="Search movies"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") searchMovies(); }}
            />
            <Button onClick={searchMovies} colorScheme="teal">Search</Button>
          </HStack>
        </VStack>
      </Box>

      {results.length > 0 && (
      <Box position="relative" zIndex={2} bg="gray.800" borderRadius="md" p={3} mt={0}>
        <SimpleGrid columns={[1, 2]} spacing={4}>
          {results.map((m) => (
            <Box
              key={m.id}
              bg="gray.800"
              borderRadius="md"
              overflow="hidden"
              p={3}
              cursor="pointer"
              onClick={() => openAddModal(m)}
              textAlign="center"
              display="flex"
              flexDirection="column"
              alignItems="center"
              _hover={{ bg: "gray.700", transform: "scale(1.02)", transition: "all 0.15s" }}
            >
              {m.poster_path ? (
                <>
                  <Image src={`https://image.tmdb.org/t/p/w200${m.poster_path}`} alt={m.title} mb={2} borderRadius="md" />
                  <Text fontWeight="bold">{m.title} ({m.release_date?.split("-")[0] || "N/A"})</Text>
                </>
              ) : (
                <Box display="flex" flexDirection="column" justifyContent="flex-end" flex="1" w="100%">
                  <Text fontWeight="bold">{m.title} ({m.release_date?.split("-")[0] || "N/A"})</Text>
                </Box>
              )}
            </Box>
          ))}
        </SimpleGrid>
      </Box>
      )}

        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Add {selectedMovie?.title}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <Select placeholder="Format" value={format} onChange={(e) => setFormat(e.target.value)}>
                  {formatOptions.map((opt) => <option key={opt}>{opt}</option>)}
                </Select>
                <Select placeholder="Studio (optional)" value={studio} onChange={(e) => setStudio(e.target.value)}>
                  {studioOptions.map((opt) => <option key={opt}>{opt}</option>)}
                </Select>
                <Select placeholder="Type (optional)" value={type} onChange={(e) => setType(e.target.value)}>
                  {typeOptions.map((opt) => <option key={opt}>{opt}</option>)}
                </Select>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="green" mr={3} onClick={addMovie}>Add Movie</Button>
              <Button onClick={onClose}>Cancel</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
    </Box>
  );
}
