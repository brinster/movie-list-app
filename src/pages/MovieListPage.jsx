import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "../supabaseClient";
import {
  Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  Box, Input, Select, HStack, Image, Text, Button, VStack, Flex
} from "@chakra-ui/react";
import { TriangleDownIcon, TriangleUpIcon, ChevronDownIcon, ChevronRightIcon } from "@chakra-ui/icons";
import PosterCollage from "../components/PosterCollage";

export default function MovieListPage() {
  const [movies, setMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterFormat, setFilterFormat] = useState("");
  const [filterStudio, setFilterStudio] = useState("");
  const [filterStatuses, setFilterStatuses] = useState([]); 
  const [sortConfig, setSortConfig] = useState([{ key: "added_at", direction: "desc" }]);
  const [expandedCollections, setExpandedCollections] = useState([]);

  const typeOptions = ["Steelbook", "Box Set", "Special Edition", "None"];
  const formatOptions = ["4K + BD", "4K", "BD", "DVD"];
  const studioOptions = ["A24", "Arrow", "Criterion", "Kino Lorber", "Lionsgate", "Neon", "Paramount", "Shout!", "Sony", "Universal", "Warner Bros", "None"];
  
  const statusOptions = [
    { label: "👀 Let's Watch", value: "lets_watch", activeBg: "yellow.900", activeText: "yellow.300", activeBorder: "yellow.700" },
    { label: "✓ 👀 We Watched", value: "we_watched", activeBg: "green.900", activeText: "green.300", activeBorder: "green.700" },
    { label: "✓ Sr Watched", value: "sr_watched", activeBg: "purple.900", activeText: "purple.300", activeBorder: "purple.700" },
    { label: "✓ Jr Watched", value: "jr_watched", activeBg: "blue.900", activeText: "blue.300", activeBorder: "blue.700" },
    { label: "📍 At Sr's", value: "loc_sr", activeBg: "purple.900", activeText: "purple.300", activeBorder: "purple.700" },
    { label: "📍 At Jr's", value: "loc_jr", activeBg: "blue.900", activeText: "blue.300", activeBorder: "blue.700" },
  ];

  useEffect(() => { fetchMovies(); }, []);

  const fetchMovies = async () => {
    const { data, error } = await supabase.from("movies").select("*").order("added_at", { ascending: false });
    if (error) console.error(error);
    else setMovies(data || []);
  };

  const toggleCollection = (name) => {
    setExpandedCollections(prev => 
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    );
  };

  const toggleStatusFilter = (val) => {
    setFilterStatuses(prev => 
      prev.includes(val) ? prev.filter(item => item !== val) : [...prev, val]
    );
  };

  const openLetterboxd = (title, year) => {
    if (!title) return;
    const slugify = (str) => str.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
    const baseSlug = slugify(title);
    const finalSlug = (["parasite", "dune", "the-thing", "halloween", "suspiria", "oldboy"].includes(baseSlug) && year) ? `${baseSlug}-${year}` : baseSlug;
    window.open(`https://letterboxd.com/film/${finalSlug}/`, "_blank");
  };

  const cycleWatch = async (m) => {
    const next = m.watch_together === null ? "yes" : m.watch_together === "yes" ? "completed" : null;
    const srNext = next === "completed" ? "watched" : m.sr;
    const jrNext = next === "completed" ? "watched" : m.jr;
    setMovies((prev) => prev.map((x) => x.id === m.id ? { ...x, watch_together: next, sr: srNext, jr: jrNext } : x));
    await supabase.from("movies").update({ watch_together: next, sr: srNext, jr: jrNext }).eq("id", m.id);
  };

  const cyclePerson = async (m, person) => {
    const next = m[person] === "watched" ? null : "watched";
    setMovies((prev) => prev.map((x) => x.id === m.id ? { ...x, [person]: next } : x));
    await supabase.from("movies").update({ [person]: next }).eq("id", m.id);
  };

  const cycleLocation = async (m) => {
    const next = m.location === "Sr" ? "Jr" : m.location === "Jr" ? null : "Sr";
    setMovies((prev) => prev.map((x) => x.id === m.id ? { ...x, location: next } : x));
    await supabase.from("movies").update({ location: next }).eq("id", m.id);
  };

  const requestSort = (key, event) => {
    const isShift = event.shiftKey;
    setSortConfig((prev) => {
      const existing = prev.find((s) => s.key === key);
      if (!isShift) return [{ key, direction: existing?.direction === "asc" ? "desc" : "asc" }];
      return existing ? prev.map((s) => s.key === key ? { ...s, direction: s.direction === "asc" ? "desc" : "asc" } : s) : [...prev, { key, direction: "asc" }];
    });
  };

  const getSortIcon = (key) => {
    const sort = sortConfig.find((s) => s.key === key);
    if (!sort) return null;
    return sort.direction === "asc" ? <TriangleUpIcon ml={1} boxSize="9px" opacity={0.7} /> : <TriangleDownIcon ml={1} boxSize="9px" opacity={0.7} />;
  };

  const { filteredGroups, totalMovieCount } = useMemo(() => {
    let filtered = [...movies];
    if (searchQuery) filtered = filtered.filter((m) => m.title.toLowerCase().includes(searchQuery.toLowerCase()));
    if (filterFormat) filtered = filtered.filter((m) => filterFormat === "None" ? !m.format : m.format === filterFormat);
    if (filterStudio) filtered = filtered.filter((m) => filterStudio === "None" ? !m.studio : m.studio === filterStudio);
    if (filterType) filtered = filtered.filter((m) => filterType === "None" ? !m.type : m.type === filterType);
    
    if (filterStatuses.length > 0) {
      filtered = filtered.filter((m) => {
        return filterStatuses.every(status => {
          switch (status) {
            case "lets_watch": return m.watch_together === "yes";
            case "we_watched": return m.watch_together === "completed";
            case "sr_watched": return m.sr === "watched";
            case "jr_watched": return m.jr === "watched";
            case "loc_sr": return m.location === "Sr";
            case "loc_jr": return m.location === "Jr";
            default: return true;
          }
        });
      });
    }

    filtered.sort((a, b) => {
      for (const sort of sortConfig) {
        let valA = a[sort.key] ?? "";
        let valB = b[sort.key] ?? "";
        if (sort.key === "added_at") {
          const diff = new Date(valA) - new Date(valB);
          if (diff !== 0) return sort.direction === "asc" ? diff : -diff;
          continue;
        }
        valA = typeof valA === "string" ? valA.toLowerCase() : valA;
        valB = typeof valB === "string" ? valB.toLowerCase() : valB;
        if (valA < valB) return sort.direction === "asc" ? -1 : 1;
        if (valA > valB) return sort.direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    const groups = [];
    const seenCollections = new Set();

    filtered.forEach(m => {
      if (m.collection_name) {
        if (!seenCollections.has(m.collection_name)) {
          seenCollections.add(m.collection_name);
          const collectionMembers = filtered
            .filter(item => item.collection_name === m.collection_name)
            .sort((a, b) => (a.year || 0) - (b.year || 0));

          groups.push({
            type: "collection",
            id: m.collection_name, 
            name: m.collection_name,
            members: collectionMembers,
            format: collectionMembers[0].format,
            studio: collectionMembers[0].studio,
            movieType: collectionMembers[0].type
          });
        }
      } else {
        groups.push({ type: "single", ...m });
      }
    });

    return { filteredGroups: groups, totalMovieCount: filtered.length };
  }, [movies, searchQuery, filterType, filterFormat, filterStudio, filterStatuses, sortConfig]);

  const controlStyle = {
    bg: "gray.700",
    border: "1px solid",
    borderColor: "whiteAlpha.100",
    borderRadius: "8px",
    color: "white",
    fontSize: "13px",
    _placeholder: { color: "whiteAlpha.400" },
    _focus: { borderColor: "teal.400", boxShadow: "0 0 0 1px var(--chakra-colors-teal-400)" },
  };

  const FormatBadge = ({ value }) => value ? (
    <Box as="span" bg="teal.900" color="teal.200" fontSize="11px" fontWeight="700" letterSpacing="0.06em" px={2} py="2px" borderRadius="5px" border="1px solid" borderColor="teal.700">
      {value}
    </Box>
  ) : <Text color="whiteAlpha.300" fontSize="13px">—</Text>;

  const TypeBadge = ({ value }) => value ? (
    <Box as="span" bg="whiteAlpha.100" color="whiteAlpha.700" fontSize="11px" fontWeight="600" letterSpacing="0.04em" px={2} py="2px" borderRadius="5px" border="1px solid" borderColor="whiteAlpha.200">
      {value}
    </Box>
  ) : <Text color="whiteAlpha.300" fontSize="13px">—</Text>;

  const StatusButtons = ({ m }) => (
    <HStack spacing={1}>
      <Button size="xs" onClick={() => cycleWatch(m)} border="1px solid" bg={m.watch_together === "yes" ? "yellow.900" : m.watch_together === "completed" ? "green.900" : "transparent"} color={m.watch_together === "yes" ? "yellow.300" : m.watch_together === "completed" ? "green.300" : "whiteAlpha.400"} borderColor={m.watch_together === "yes" ? "yellow.700" : m.watch_together === "completed" ? "green.700" : "whiteAlpha.100"}>
        {m.watch_together === "completed" ? "✓ 👀" : "👀"}
      </Button>
      <Button size="xs" onClick={() => cyclePerson(m, "sr")} border="1px solid" bg={m.sr === "watched" ? "purple.900" : "transparent"} color={m.sr === "watched" ? "purple.300" : "whiteAlpha.400"} borderColor={m.sr === "watched" ? "purple.700" : "whiteAlpha.100"}>
        {m.sr === "watched" ? "✓ Sr" : "Sr"}
      </Button>
      <Button size="xs" onClick={() => cyclePerson(m, "jr")} border="1px solid" bg={m.jr === "watched" ? "blue.900" : "transparent"} color={m.jr === "watched" ? "blue.300" : "whiteAlpha.400"} borderColor={m.jr === "watched" ? "blue.700" : "whiteAlpha.100"}>
        {m.jr === "watched" ? "✓ Jr" : "Jr"}
      </Button>
      <Button size="xs" onClick={() => cycleLocation(m)} border="1px solid" bg={m.location === "Sr" ? "purple.900" : m.location === "Jr" ? "blue.900" : "transparent"} color={m.location === "Sr" ? "purple.300" : m.location === "Jr" ? "blue.300" : "whiteAlpha.400"} borderColor={m.location === "Sr" ? "purple.700" : m.location === "Jr" ? "blue.700" : "whiteAlpha.100"}>
        📍{m.location || ""}
      </Button>
    </HStack>
  );

  return (
    <Box position="relative" zIndex={1}>
      <PosterCollage movies={movies} />
      <Box bg="gray.800" borderRadius="12px" overflow="hidden" style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.06) inset, 0 4px 24px rgba(0,0,0,0.35)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <VStack align="stretch" spacing={3} p={4} borderBottom="1px solid" borderColor="whiteAlpha.100">
          <HStack spacing={2} flexWrap="wrap">
            <Input placeholder="Search titles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} maxW="200px" size="sm" h="34px" {...controlStyle} />
            {[
                { p: "Format", v: filterFormat, set: setFilterFormat, opt: formatOptions, w: "115px" },
                { p: "Studio", v: filterStudio, set: setFilterStudio, opt: studioOptions, w: "155px" },
                { p: "Type", v: filterType, set: setFilterType, opt: typeOptions, w: "130px" }
            ].map((f) => (
              <Select key={f.p} placeholder={f.p} value={f.v} onChange={(e) => f.set(e.target.value)} maxW={f.w} size="sm" h="34px" {...controlStyle}>
                {f.opt.map((opt) => <option key={opt} style={{ background: "#2d3748" }}>{opt}</option>)}
              </Select>
            ))}
          </HStack>
          <HStack spacing={2} flexWrap="wrap">
            {statusOptions.map((opt) => {
              const isActive = filterStatuses.includes(opt.value);
              return (
                <Button key={opt.value} size="xs" onClick={() => toggleStatusFilter(opt.value)} borderRadius="full" fontSize="10px" variant="outline" bg={isActive ? opt.activeBg : "transparent"} color={isActive ? opt.activeText : "whiteAlpha.400"} borderColor={isActive ? opt.activeBorder : "whiteAlpha.100"}>
                  {opt.label}
                </Button>
              );
            })}
          </HStack>
        </VStack>

        <TableContainer>
          <Table variant="unstyled" size="sm">
            <Thead borderBottom="1px solid" borderColor="whiteAlpha.100">
              <Tr>
                <Th px={4} py={3} color="whiteAlpha.400" fontSize="10px" letterSpacing="0.1em" textTransform="uppercase">Poster</Th>
                <Th px={4} py={3} color="whiteAlpha.400" fontSize="10px" letterSpacing="0.1em" textTransform="uppercase" cursor="pointer" onClick={(e) => requestSort("title", e)}>Title {getSortIcon("title")}</Th>
                <Th px={4} py={3} color="whiteAlpha.400" fontSize="10px" letterSpacing="0.1em" textTransform="uppercase">Format</Th>
                <Th px={4} py={3} color="whiteAlpha.400" fontSize="10px" letterSpacing="0.1em" textTransform="uppercase">Studio</Th>
                <Th px={4} py={3} color="whiteAlpha.400" fontSize="10px" letterSpacing="0.1em" textTransform="uppercase">Type</Th>
                <Th px={4} py={3} color="whiteAlpha.400" fontSize="10px" letterSpacing="0.1em" textTransform="uppercase">Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredGroups.map((group) => {
                if (group.type === "collection") {
                  const isExpanded = expandedCollections.includes(group.id);
                  return (
                    <React.Fragment key={group.id}>
                      <Tr borderBottom="1px solid" borderColor="whiteAlpha.50" onClick={() => toggleCollection(group.id)} cursor="pointer" _hover={{ bg: "whiteAlpha.50" }}>
                        <Td px={4} py={2}>
                          <Box position="relative" w="50px" h="54px">
                            {group.members.slice(0, 3).reverse().map((m, idx) => (
                              <Image key={m.id} src={m.poster_url} w="36px" h="54px" objectFit="cover" borderRadius="4px" border="2px solid" borderColor="gray.800" position="absolute" left={`${(2 - idx) * 6}px`} zIndex={idx} />
                            ))}
                          </Box>
                        </Td>
                        <Td px={4} py={2}>
                          <VStack align="start" spacing={0}>
                            <Text color="teal.300" fontWeight="bold" fontSize="9px" letterSpacing="widest" textTransform="uppercase">BOX SET</Text>
                            <HStack spacing={1}>
                              {isExpanded ? <ChevronDownIcon boxSize="12px" /> : <ChevronRightIcon boxSize="12px" />}
                              <Text color="white" fontWeight="500" fontSize="13px">{group.name}</Text>
                            </HStack>
                          </VStack>
                        </Td>
                        <Td px={4} py={2}><FormatBadge value={group.format} /></Td>
                        <Td px={4} py={2} color="whiteAlpha.500" fontSize="13px">{group.studio || "—"}</Td>
                        <Td px={4} py={2}><TypeBadge value={group.movieType} /></Td>
                        <Td px={4} py={2}>
                          <Text fontSize="11px" color="whiteAlpha.500" fontWeight="bold">{group.members.length} MOVIES</Text>
                        </Td>
                      </Tr>
                      {isExpanded && group.members.map((m) => (
                        <Tr key={m.id} borderBottom="1px solid" borderColor="whiteAlpha.50" bg="blackAlpha.300">
                          <Td px={4} py={2}>
                            <Image src={m.poster_url} w="36px" h="54px" objectFit="cover" borderRadius="4px" opacity={0.9} cursor="pointer" onClick={() => openLetterboxd(m.title, m.year)} />
                          </Td>
                          <Td px={4} py={2}>
                            <Text color="white" fontWeight="500" fontSize="13px" cursor="pointer" onClick={() => openLetterboxd(m.title, m.year)} _hover={{ color: "teal.300" }}>{m.title}</Text>
                            <Text fontSize="11px" color="whiteAlpha.500">{m.year}</Text>
                          </Td>
                          <Td px={4} py={2}><FormatBadge value={m.format} /></Td>
                          <Td px={4} py={2} color="whiteAlpha.500" fontSize="13px">{m.studio || "—"}</Td>
                          <Td px={4} py={2}><TypeBadge value={m.type} /></Td>
                          <Td px={4} py={2}><StatusButtons m={m} /></Td>
                        </Tr>
                      ))}
                    </React.Fragment>
                  );
                }
                return (
                  <Tr key={group.id} borderBottom="1px solid" borderColor="whiteAlpha.50" _hover={{ bg: "whiteAlpha.50" }}>
                    <Td px={4} py={2}>
                      <Image src={group.poster_url} w="36px" h="54px" objectFit="cover" borderRadius="5px" cursor="pointer" onClick={() => openLetterboxd(group.title, group.year)} />
                    </Td>
                    <Td px={4} py={2}>
                      <Text color="white" fontWeight="500" fontSize="13px" cursor="pointer" onClick={() => openLetterboxd(group.title, group.year)}>{group.title}</Text>
                      <Text fontSize="11px" color="whiteAlpha.500">{group.year}</Text>
                    </Td>
                    <Td px={4} py={2}><FormatBadge value={group.format} /></Td>
                    <Td px={4} py={2} color="whiteAlpha.500" fontSize="13px">{group.studio || "—"}</Td>
                    <Td px={4} py={2}><TypeBadge value={group.type} /></Td>
                    <Td px={4} py={2}><StatusButtons m={group} /></Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </TableContainer>
        
        <Flex justify="flex-end" p={4} borderTop="1px solid" borderColor="whiteAlpha.100" bg="whiteAlpha.50">
          <Text color="whiteAlpha.600" fontSize="11px" fontWeight="bold" letterSpacing="0.04em">
            TOTAL: {totalMovieCount} {totalMovieCount === 1 ? 'MOVIE' : 'MOVIES'}
          </Text>
        </Flex>
      </Box>
    </Box>
  );
}