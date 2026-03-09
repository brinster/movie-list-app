// src/pages/MovieListPage.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "../supabaseClient";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Box,
  Input,
  Select,
  HStack,
  Image, // Chakra Image for table
} from "@chakra-ui/react";
import { TriangleDownIcon, TriangleUpIcon } from "@chakra-ui/icons";

export default function MovieListPage() {
  const [movies, setMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterFormat, setFilterFormat] = useState("");
  const [filterStudio, setFilterStudio] = useState("");
  const [sortConfig, setSortConfig] = useState([{ key: "added_at", direction: "desc" }]);

  const typeOptions = ["Steelbook", "Box Set", "None"];
  const formatOptions = ["4K + BD", "4K", "BD", "DVD"];
  const studioOptions = [
    "A24",
    "Arrow",
    "Criterion",
    "Kino Lorber",
    "Lionsgate",
    "Paramount",
    "Shout!",
    "Sony",
    "Universal",
    "Warner Bros",
    "None",
  ];

  const canvasRef = useRef(null);

  useEffect(() => {
    fetchMovies();
  }, []);

  useEffect(() => {
    drawCanvasBackground();
    // eslint-disable-next-line
  }, [movies]);

  const fetchMovies = async () => {
    const { data, error } = await supabase
      .from("movies")
      .select("*")
      .order("added_at", { ascending: false });
    if (error) console.error(error);
    else setMovies(data || []);
  };

  // Draw collage only in left/right margins, no overlapping posters
  const drawCanvasBackground = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const containerWidth = Math.min(window.innerWidth, 1000);
    const marginWidth = (window.innerWidth - containerWidth) / 2;

    const postersWithUrls = movies.filter((m) => m.poster_url);

    // Standard movie poster ratio: 2:3 (width:height)
    const POSTER_RATIO = 2 / 3;

    // Dynamic sizing: fewer posters = larger, more posters = smaller
    // Fixed poster width — slight per-poster variation (±12%) for a natural feel
    const baseWidth = 110;

    // Small padding gap between posters
    const GAP = 6;
    const MAX_ATTEMPTS = 30;

    // Track placed rects for overlap detection
    const placed = [];

    const overlaps = (x, y, w, h) => {
      for (const r of placed) {
        if (
          x < r.x + r.w + GAP &&
          x + w + GAP > r.x &&
          y < r.y + r.h + GAP &&
          y + h + GAP > r.y
        ) return true;
      }
      return false;
    };

    // Pre-load all images then place them sequentially so overlap checks are reliable
    const loadedImages = [];
    let loadedCount = 0;
    let hasPlaced = false;
    const total = Math.min(postersWithUrls.length, 500);

    if (total === 0) return;

    const drawPoster = (img, x, y, w, h, angle) => {
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate(angle);
      ctx.globalAlpha = 1;
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();
    };

    const placeAll = () => {
      loadedImages.forEach(({ img, w, h }) => {
        // Max tilt ±18°, always face-up (no flips)
        const angle = (Math.random() * 36 - 18) * (Math.PI / 180);

        // Try to find a non-overlapping spot
        let foundX, foundY, foundSpot = false;
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
          const isLeft = Math.random() < 0.5;
          const x = isLeft
            ? Math.random() * Math.max(0, marginWidth - w)
            : containerWidth + marginWidth + Math.random() * Math.max(0, marginWidth - w);
          const y = Math.random() * (window.innerHeight - h);

          if (!overlaps(x, y, w, h)) {
            foundX = x; foundY = y; foundSpot = true;
            break;
          }
        }

        // Fall back to any random position if no clear spot found
        if (!foundSpot) {
          const isLeft = Math.random() < 0.5;
          foundX = isLeft
            ? Math.random() * Math.max(0, marginWidth - w)
            : containerWidth + marginWidth + Math.random() * Math.max(0, marginWidth - w);
          foundY = Math.random() * (window.innerHeight - h);
        }

        placed.push({ x: foundX, y: foundY, w, h });
        drawPoster(img, foundX, foundY, w, h, angle);
      });
    };

    postersWithUrls.slice(0, total).forEach((m) => {
      const img = new window.Image();
      img.src = m.poster_url;
      img.onload = () => {
        const w = baseWidth;
        const h = w / POSTER_RATIO;
        loadedImages.push({ img, w, h });
        loadedCount++;
        if (loadedCount === total && !hasPlaced) { hasPlaced = true; placeAll(); }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === total && !hasPlaced) { hasPlaced = true; placeAll(); }
      };
    });
  };

  const requestSort = (key, event) => {
    const isShift = event.shiftKey;
    setSortConfig((prev) => {
      const existing = prev.find((s) => s.key === key);
      if (!isShift) {
        if (existing) return [{ key, direction: existing.direction === "asc" ? "desc" : "asc" }];
        return [{ key, direction: "asc" }];
      }
      if (existing) {
        return prev.map((s) =>
          s.key === key ? { ...s, direction: s.direction === "asc" ? "desc" : "asc" } : s
        );
      }
      return [...prev, { key, direction: "asc" }];
    });
  };

  const getSortIcon = (key) => {
    const sort = sortConfig.find((s) => s.key === key);
    if (!sort) return null;
    return sort.direction === "asc" ? <TriangleUpIcon ml={1} /> : <TriangleDownIcon ml={1} />;
  };

  const displayedMovies = useMemo(() => {
    let filtered = [...movies];

    if (searchQuery) filtered = filtered.filter((m) => m.title.toLowerCase().includes(searchQuery.toLowerCase()));
    if (filterFormat)
      filtered = filtered.filter((m) => (filterFormat === "None" ? !m.format : m.format === filterFormat));
    if (filterStudio)
      filtered = filtered.filter((m) => (filterStudio === "None" ? !m.studio : m.studio === filterStudio));
    if (filterType)
      filtered = filtered.filter((m) => (filterType === "None" ? !m.type : m.type === filterType));

    filtered.sort((a, b) => {
      for (const sort of sortConfig) {
        let valA = a[sort.key] || "";
        let valB = b[sort.key] || "";
        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();
        if (valA < valB) return sort.direction === "asc" ? -1 : 1;
        if (valA > valB) return sort.direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [movies, searchQuery, filterType, filterFormat, filterStudio, sortConfig]);

  return (
    <Box position="relative" zIndex={1}>
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0,
        }}
      />

      {/* Filters */}
        <HStack spacing={4} mb={4} flexWrap="wrap">
          <Input
            placeholder="Search by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            maxW="250px"
          />
          <Select
            placeholder="Format"
            value={filterFormat}
            onChange={(e) => setFilterFormat(e.target.value)}
            maxW="140px"
          >
            {formatOptions.map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </Select>
          <Select
            placeholder="Studio"
            value={filterStudio}
            onChange={(e) => setFilterStudio(e.target.value)}
            maxW="180px"
          >
            {studioOptions.map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </Select>
          <Select
            placeholder="Type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            maxW="180px"
          >
            {typeOptions.map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </Select>
        </HStack>

        {/* Table */}
        <TableContainer bg="gray.800" borderRadius="md" p={2}>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Poster</Th>
                <Th cursor="pointer" onClick={(e) => requestSort("title", e)}>
                  Title {getSortIcon("title")}
                </Th>
                <Th cursor="pointer" onClick={(e) => requestSort("year", e)}>
                  Year {getSortIcon("year")}
                </Th>
                <Th cursor="pointer" onClick={(e) => requestSort("format", e)}>
                  Format {getSortIcon("format")}
                </Th>
                <Th cursor="pointer" onClick={(e) => requestSort("studio", e)}>
                  Studio {getSortIcon("studio")}
                </Th>
                <Th cursor="pointer" onClick={(e) => requestSort("type", e)}>
                  Type {getSortIcon("type")}
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {displayedMovies.map((m) => (
                <Tr key={m.id}>
                  <Td>
                    {m.poster_url ? (
                      <Image
                        src={m.poster_url}
                        alt={m.title}
                        boxSize="50px"
                        objectFit="cover"
                        borderRadius="md"
                      />
                    ) : (
                      "-"
                    )}
                  </Td>
                  <Td>{m.title}</Td>
                  <Td>{m.year || "-"}</Td>
                  <Td>{m.format || "-"}</Td>
                  <Td>{m.studio || "-"}</Td>
                  <Td>{m.type || "-"}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
    </Box>
  );
}
