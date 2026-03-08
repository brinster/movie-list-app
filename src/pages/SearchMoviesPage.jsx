// src/pages/SearchMoviesPage.jsx
import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import {
  Input,
  Button,
  Box,
  VStack,
  HStack,
  Image,
  Text,
  SimpleGrid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Select,
  useDisclosure,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

export default function SearchMoviesPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [type, setType] = useState(""); // type dropdown
  const [addedBy, setAddedBy] = useState(""); // added_by dropdown
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();

  const typeOptions = [
    "4K UHD",
    "A24",
    "Arrow",
    "Blu-ray",
    "Criterion",
    "DVD",
    "Kino Lorber",
    "Paramount",
    "Shout! Factory",
    "Steelbook",
  ]; // alphabetized

  const addedByOptions = ["Jr", "Sr"]; // dropdown options

  // Search TMDB
  const searchMovies = async () => {
    if (!query) return;
    const encodedQuery = encodeURIComponent(query);

    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${process.env.REACT_APP_TMDB_KEY}&query=${encodedQuery}`
      );

      if (!res.ok) {
        console.error("TMDB API error", res.status, await res.text());
        return;
      }

      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  // Open modal and select movie to add
  const openAddModal = (movie) => {
    setSelectedMovie(movie);
    setType(""); // reset type
    setAddedBy(""); // reset addedBy
    onOpen();
  };

  // Final add to Supabase
  const addMovie = async () => {
    if (!selectedMovie) return;

    const insertData = {
      tmdb_id: parseInt(selectedMovie.id),
      title: selectedMovie.title,
      year: selectedMovie.release_date
        ? selectedMovie.release_date.split("-")[0]
        : null,
      poster_url: selectedMovie.poster_path
        ? `https://image.tmdb.org/t/p/w200${selectedMovie.poster_path}`
        : null,
      type: type || null,
      added_by: addedBy || null,
    };

    const { error } = await supabase.from("movies").insert(insertData);

    if (error) {
      console.error("Supabase insert error:", error);
      alert("Failed to add movie. Check console for details.");
    } else {
      alert(`${selectedMovie.title} added successfully!`);
      onClose();
    }
  };

  return (
    <VStack spacing={4} align="stretch">
      {/* Back button */}
      <Button colorScheme="teal" onClick={() => navigate("/")}>
        &larr; Back to Library
      </Button>

      {/* Search input */}
      <HStack>
        <Input
          placeholder="Search movies"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button onClick={searchMovies} colorScheme="teal">
          Search
        </Button>
      </HStack>

      {/* Movie results */}
      <SimpleGrid columns={[1, 2]} spacing={4}>
        {results.map((m) => (
          <Box
            key={m.id}
            borderWidth="1px"
            borderRadius="md"
            overflow="hidden"
            p={2}
          >
            {m.poster_path && (
              <Image
                src={`https://image.tmdb.org/t/p/w200${m.poster_path}`}
                alt={m.title}
                mb={2}
                borderRadius="md"
              />
            )}
            <Text fontWeight="bold">
              {m.title} ({m.release_date?.split("-")[0] || "N/A"})
            </Text>
            <Button
              size="sm"
              mt={2}
              colorScheme="green"
              onClick={() => openAddModal(m)}
            >
              Add
            </Button>
          </Box>
        ))}
      </SimpleGrid>

      {/* Add Movie Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add {selectedMovie?.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              {/* Type dropdown */}
              <Select
                placeholder="Type"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {typeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Select>

              {/* Added By dropdown */}
              <Select
                placeholder="“Added by"
                value={addedBy}
                onChange={(e) => setAddedBy(e.target.value)}
              >
                {addedByOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Select>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="green" mr={3} onClick={addMovie}>
              Add Movie
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}