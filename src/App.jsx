// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Box, Heading, Button } from "@chakra-ui/react";
import MovieListPage from "./pages/MovieListPage";
import SearchMoviesPage from "./pages/SearchMoviesPage";

function App() {
  return (
    <Router>
      {/* Outer Box: full width, dark background */}
      <Box bg="gray.900" minH="100vh" w="100%">
        {/* Inner Box: responsive width */}
        <Box maxW={{ base: "95%", md: "1000px" }} mx="auto" p={4} color="white">
          <Heading mb={6} textAlign="center">
            Movies Our Library
          </Heading>

          <Box mb={4} textAlign="center">
            <Link to="/search">
              <Button colorScheme="teal">Search & Add Movies</Button>
            </Link>
          </Box>

          <Routes>
            <Route path="/" element={<MovieListPage />} />
            <Route path="/search" element={<SearchMoviesPage />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;