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
        maxW={{ base: "95%", md: "1100px" }}
        mx="auto"
        pt={5}
        pb={8}
        px={4}
        color="white"
        position="relative"
        zIndex={1}
        isolation="isolate"
      >
        {/* Header */}
        <Box
          mb={4}
          position="relative"
          zIndex={2}
          borderRadius="14px"
          px={7}
          py={5}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={3}
          overflow="hidden"
          style={{
            background: "linear-gradient(135deg, #1a202c 0%, #171923 60%, #1a202c 100%)",
            boxShadow: "0 1px 0 rgba(255,255,255,0.07) inset, 0 6px 32px rgba(0,0,0,0.45)",
            borderTop: "1px solid rgba(255,255,255,0.09)",
          }}
        >
          {/* Decorative accent line */}
          <Box
            position="absolute"
            left={0} top={0} bottom={0}
            w="3px"
            borderRadius="14px 0 0 14px"
            style={{ background: "linear-gradient(180deg, #4fd1c5 0%, #2c7a7b 100%)" }}
          />

          {/* Title group */}
          <Box pl={2}>
            <Box
              fontSize="10px"
              fontWeight="700"
              letterSpacing="0.18em"
              textTransform="uppercase"
              mb="5px"
              style={{
                background: "linear-gradient(90deg, #81e6d9, #4fd1c5)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Brinson Movie Collection
            </Box>
            <Heading
              size="lg"
              fontWeight="800"
              letterSpacing="-0.02em"
              lineHeight="1"
            >
              Physical Media Library
            </Heading>
          </Box>

          <Button
            onClick={() => navigate(isSearchPage ? "/" : "/search")}
            size="sm"
            bg={isSearchPage ? "whiteAlpha.100" : "teal.500"}
            color="white"
            borderRadius="8px"
            fontWeight="600"
            fontSize="13px"
            letterSpacing="0.02em"
            px={4}
            h="36px"
            border="1px solid"
            borderColor={isSearchPage ? "whiteAlpha.200" : "teal.400"}
            _hover={{
              bg: isSearchPage ? "whiteAlpha.200" : "teal.400",
              transform: "translateY(-1px)",
              boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
            }}
            _active={{ transform: "translateY(0)" }}
            transition="all 0.15s ease"
          >
            {isSearchPage ? "← Library" : "+ Add Movies"}
          </Button>
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
