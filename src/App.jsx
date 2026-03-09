// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Box, Heading, Button } from "@chakra-ui/react";
import MovieListPage from "./pages/MovieListPage";
import SearchMoviesPage from "./pages/SearchMoviesPage";

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const isSearchPage = location.pathname === "/search";

  return (
    <Box bg="gray.900" minH="100vh" w="100%">
      <Box
        maxW={{ base: "95%", md: "1000px" }}
        mx="auto"
        p={4}
        color="white"
        position="relative"
        zIndex={1}
        isolation="isolate"
      >
        <Box
          bg="gray.800"
          borderRadius="md"
          p={4}
          mb={4}
          textAlign="center"
          position="relative"
          zIndex={2}
        >
          <Heading mb={4}>Brinson Physical Media Library</Heading>
          {isSearchPage ? (
            <Button colorScheme="teal" onClick={() => navigate("/")}>
              Movie Library
            </Button>
          ) : (
            <Button colorScheme="teal" onClick={() => navigate("/search")}>
              Search & Add Movies
            </Button>
          )}
        </Box>

        <Routes>
          <Route path="/" element={<MovieListPage />} />
          <Route path="/search" element={<SearchMoviesPage />} />
        </Routes>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
