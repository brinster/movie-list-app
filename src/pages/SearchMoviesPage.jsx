import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
    Input, Button, Box, HStack, Image, Text, SimpleGrid,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
    ModalBody, ModalCloseButton, Select, useDisclosure, VStack,
    useToast 
} from "@chakra-ui/react";
import PosterCollage from "../components/PosterCollage";

export default function SearchMoviesPage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [movies, setMovies] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    
    const [format, setFormat] = useState("");
    const [studio, setStudio] = useState("");
    const [type, setType] = useState("");
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
    }, []);

    const fetchMovies = async () => {
        const { data } = await supabase.from("movies").select("poster_url, added_at");
        setMovies(data || []);
    };

    const searchMovies = async () => {
        if (!query) return;
        const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${process.env.REACT_APP_TMDB_KEY}&query=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
    };

    const openAddModal = (movie) => {
        setSelectedMovie(movie);
        setFormat(""); 
        setStudio(""); 
        setType(""); 
        setWatchTogether(null);
        setSr(null); 
        setJr(null); 
        setLocation(null);
        onOpen();
    };

    const handleWatchCycle = () => {
        let nextState;
        if (watchTogether === null) {
            nextState = "yes";
        } else if (watchTogether === "yes") {
            nextState = "completed";
            setSr("watched"); 
            setJr("watched"); 
        } else {
            nextState = null;
        }
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
            watch_together: watchTogether, 
            sr: sr, 
            jr: jr, 
            location: location,
        });

        setIsAdding(false);

        if (error) {
            toast({
                title: "Error adding movie",
                description: error.message,
                status: "error",
                duration: 4000,
                isClosable: true,
                position: "top", // Moved to top
            });
        } else { 
            onClose(); 
            fetchMovies();
            toast({
                title: "Movie Added!",
                description: `${selectedMovie.title} is now in your library.`,
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "top", // Moved to top
                variant: "solid" // Switched to solid for higher visibility at the top
            });
        }
    };

    const selectStyle = { bg: "gray.700", border: "1px solid", borderColor: "whiteAlpha.100", color: "white" };

    return (
        <Box position="relative" zIndex={1}>
            <PosterCollage movies={movies} />
            
            <Box bg="gray.800" borderRadius="12px" p={4} mb={3} boxShadow="0 4px 24px rgba(0,0,0,0.35)">
                <HStack spacing={3}>
                    <Input 
                        placeholder="Search for a movie..." 
                        value={query} 
                        onChange={(e) => setQuery(e.target.value)} 
                        onKeyDown={(e) => e.key === "Enter" && searchMovies()} 
                        bg="gray.700" 
                        color="white" 
                        border="1px solid"
                        borderColor="whiteAlpha.200"
                        _focus={{ borderColor: "teal.500" }}
                    />
                    <Button onClick={searchMovies} bg="teal.500" color="white" _hover={{ bg: "teal.600" }}>Search</Button>
                </HStack>
            </Box>

            {results.length > 0 && (
                <Box bg="gray.800" borderRadius="12px" p={4} boxShadow="0 4px 24px rgba(0,0,0,0.35)">
                    <SimpleGrid columns={[2, 3, 4, 5]} spacing={3}>
                        {results.map((m) => (
                            <Box 
                                key={m.id} 
                                onClick={() => openAddModal(m)} 
                                cursor="pointer" 
                                bg="gray.700" 
                                borderRadius="8px" 
                                overflow="hidden" 
                                transition="all 0.2s"
                                _hover={{ transform: "translateY(-4px)", borderColor: "teal.500", boxShadow: "xl" }} 
                                border="1px solid" 
                                borderColor="whiteAlpha.100"
                            >
                                <Image 
                                    src={`https://image.tmdb.org/t/p/w200${m.poster_path}`} 
                                    alt={m.title} 
                                    fallbackSrc="https://via.placeholder.com/200x300?text=No+Poster" 
                                />
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
                    <ModalHeader pb={1} fontSize="lg">{selectedMovie?.title}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={3} align="stretch">
                            <Select placeholder="Format" value={format} onChange={(e) => setFormat(e.target.value)} {...selectStyle}>
                                {formatOptions.map(o => <option key={o} style={{background:"#2d3748"}}>{o}</option>)}
                            </Select>
                            
                            <Select placeholder="Studio (optional)" value={studio} onChange={(e) => setStudio(e.target.value)} {...selectStyle}>
                                {studioOptions.map(o => <option key={o} style={{background:"#2d3748"}}>{o}</option>)}
                            </Select>
                            
                            <Select placeholder="Type (optional)" value={type} onChange={(e) => setType(e.target.value)} {...selectStyle}>
                                {typeOptions.map(o => <option key={o} style={{background:"#2d3748"}}>{o}</option>)}
                            </Select>

                            <Box pt={2}>
                                <Text fontSize="10px" fontWeight="800" mb={2} letterSpacing="0.1em" textTransform="uppercase" color="whiteAlpha.400">Initial Status</Text>
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
                    <ModalFooter>
                        <Button 
                            bg="teal.500" 
                            w="full" 
                            onClick={addMovie} 
                            isLoading={isAdding} 
                            _hover={{ bg: "teal.600" }}
                        >
                            Add to Library
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}