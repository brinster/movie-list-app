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
  Image,
} from "@chakra-ui/react";
import { TriangleDownIcon, TriangleUpIcon } from "@chakra-ui/icons";

export default function MovieListPage({ titleBottom = 0 }) {
  const [movies, setMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterFormat, setFilterFormat] = useState("");
  const [filterStudio, setFilterStudio] = useState("");
  const [sortConfig, setSortConfig] = useState([{ key: "added_at", direction: "desc" }]);

  const typeOptions = ["Steelbook", "Box Set", "None"];
  const formatOptions = ["4K + BD", "4K", "BD", "DVD"];
  const studioOptions = [
    "A24", "Arrow", "Criterion", "Kino Lorber", "Lionsgate",
    "Paramount", "Shout!", "Sony", "Universal", "Warner Bros", "None",
  ];

  const canvasRef = useRef(null);
  const drawCancelRef = useRef(false);

  useEffect(() => { fetchMovies(); }, []);

  // Clear canvas immediately on mount so old collage never shows on navigation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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

  const drawCanvasBackground = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Cancel any previous in-progress draw
    drawCancelRef.current = true;
    const cancelled = { value: false };
    drawCancelRef.current = cancelled;

    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const containerWidth = Math.min(window.innerWidth, 1000);
    const marginWidth = (window.innerWidth - containerWidth) / 2;


    const postersWithUrls = movies
      .filter((m) => m.poster_url)
      .slice()
      .sort((a, b) => new Date(a.added_at) - new Date(b.added_at));

    const POSTER_RATIO = 2 / 3;
    const baseWidth = 110;
    const GAP = 6;
    const MAX_ATTEMPTS = 30;
    const placed = [];

    const overlaps = (x, y, w, h) => {
      for (const r of placed) {
        if (x < r.x + r.w + GAP && x + w + GAP > r.x &&
            y < r.y + r.h + GAP && y + h + GAP > r.y) return true;
      }
      return false;
    };

    const loadedImages = [];
    let loadedCount = 0;
    let hasPlaced = false;
    const total = Math.min(postersWithUrls.length, 500);
    if (total === 0) return;

    const drawPoster = (img, x, y, w, h, angle) => {
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate(angle);

      // Drop shadow for depth
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 3;

      // Draw poster image
      ctx.globalAlpha = 1;
      ctx.drawImage(img, -w / 2, -h / 2, w, h);

      // Reset shadow before drawing overlays
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Thin dark border
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(-w / 2, -h / 2, w, h);

      // Top-left highlight edge
      const highlight = ctx.createLinearGradient(-w / 2, -h / 2, -w / 2 + 6, -h / 2 + 6);
      highlight.addColorStop(0, "rgba(255,255,255,0.12)");
      highlight.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = highlight;
      ctx.fillRect(-w / 2, -h / 2, w, h);

      // Bottom-right inner shadow
      const shadow = ctx.createLinearGradient(w / 2, h / 2, w / 2 - 12, h / 2 - 12);
      shadow.addColorStop(0, "rgba(0,0,0,0.1)");
      shadow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = shadow;
      ctx.fillRect(-w / 2, -h / 2, w, h);

      ctx.restore();
    };

    const placeAll = () => {
      loadedImages.forEach(({ img, w, h }) => {
        const angle = (Math.random() * 36 - 18) * (Math.PI / 180);

        // Allow posters to bleed slightly off screen edges for a more natural look
        const BLEED = 30;
        const randPos = () => {
          const isLeft = Math.random() < 0.5;
          const x = isLeft
            ? -BLEED + Math.random() * Math.max(0, marginWidth - w + BLEED)
            : containerWidth + marginWidth + Math.random() * Math.max(0, marginWidth - w + BLEED);
          const y = -BLEED + Math.random() * (window.innerHeight - h + BLEED * 2);
          return { x, y };
        };

        let { x: foundX, y: foundY } = randPos();
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
          const { x, y } = randPos();
          if (!overlaps(x, y, w, h)) { foundX = x; foundY = y; break; }
        }

        placed.push({ x: foundX, y: foundY, w, h });
        drawPoster(img, foundX, foundY, w, h, angle);
      });
    };

    postersWithUrls.slice(0, total).forEach((m) => {
      const img = new window.Image();
      img.src = m.poster_url;
      img.onload = () => {
        loadedImages.push({ img, w: baseWidth, h: baseWidth / POSTER_RATIO });
        loadedCount++;
        if (loadedCount === total && !hasPlaced && !cancelled.value) { hasPlaced = true; placeAll(); }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === total && !hasPlaced && !cancelled.value) { hasPlaced = true; placeAll(); }
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
    if (filterFormat) filtered = filtered.filter((m) => (filterFormat === "None" ? !m.format : m.format === filterFormat));
    if (filterStudio) filtered = filtered.filter((m) => (filterStudio === "None" ? !m.studio : m.studio === filterStudio));
    if (filterType) filtered = filtered.filter((m) => (filterType === "None" ? !m.type : m.type === filterType));

    filtered.sort((a, b) => {
      for (const sort of sortConfig) {
        let valA = a[sort.key] ?? "";
        let valB = b[sort.key] ?? "";
        if (sort.key === "added_at") {
          const diff = new Date(valA) - new Date(valB);
          if (diff !== 0) return sort.direction === "asc" ? diff : -diff;
          continue;
        }
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
    <Box position="relative" zIndex={1} isolation="isolate">
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed", top: 0, left: 0,
          width: "100vw", height: "100vh",
          zIndex: -1, pointerEvents: "none",
        }}
      />

      <Box bg="gray.800" borderRadius="md" overflow="hidden">
        <Box p={3} borderBottom="1px solid" borderColor="gray.700">
          <HStack spacing={4} flexWrap="wrap">
            <Input placeholder="Search by title..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} maxW="250px" />
            <Select placeholder="Format" value={filterFormat} onChange={(e) => setFilterFormat(e.target.value)} maxW="140px">
              {formatOptions.map((opt) => <option key={opt}>{opt}</option>)}
            </Select>
            <Select placeholder="Studio" value={filterStudio} onChange={(e) => setFilterStudio(e.target.value)} maxW="180px">
              {studioOptions.map((opt) => <option key={opt}>{opt}</option>)}
            </Select>
            <Select placeholder="Type" value={filterType} onChange={(e) => setFilterType(e.target.value)} maxW="180px">
              {typeOptions.map((opt) => <option key={opt}>{opt}</option>)}
            </Select>
          </HStack>
        </Box>

        <TableContainer p={2}>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Poster</Th>
                <Th cursor="pointer" onClick={(e) => requestSort("title", e)}>Title {getSortIcon("title")}</Th>
                <Th cursor="pointer" onClick={(e) => requestSort("year", e)}>Year {getSortIcon("year")}</Th>
                <Th cursor="pointer" onClick={(e) => requestSort("format", e)}>Format {getSortIcon("format")}</Th>
                <Th cursor="pointer" onClick={(e) => requestSort("studio", e)}>Studio {getSortIcon("studio")}</Th>
                <Th cursor="pointer" onClick={(e) => requestSort("type", e)}>Type {getSortIcon("type")}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {displayedMovies.map((m) => (
                <Tr key={m.id}>
                  <Td>
                    {m.poster_url
                      ? <Image src={m.poster_url} alt={m.title} boxSize="50px" objectFit="cover" borderRadius="md" />
                      : "-"}
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
    </Box>
  );
}
