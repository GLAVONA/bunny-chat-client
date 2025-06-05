import { useState, useCallback, useEffect } from "react";
import {
  Modal,
  TextInput,
  Grid,
  Image,
  Loader,
  Center,
  Box,
  ScrollArea,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";

interface GifPickerProps {
  opened: boolean;
  onClose: () => void;
  onSelect: (gifUrl: string) => void;
}

interface GiphyGif {
  id: string;
  images: {
    original: {
      url: string;
    };
    fixed_height: {
      url: string;
    };
  };
}

export function GifPicker({ opened, onClose, onSelect }: GifPickerProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 500);
  const [gifs, setGifs] = useState<GiphyGif[]>([]);
  const [loading, setLoading] = useState(false);

  const searchGifs = useCallback(async (query: string) => {
    if (!query) {
      setGifs([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${
          import.meta.env.VITE_GIPHY_API_KEY
        }&q=${encodeURIComponent(query)}&limit=20`
      );
      const data = await response.json();
      setGifs(data.data);
    } catch (error) {
      console.error("Error fetching GIFs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search when debounced search changes
  useEffect(() => {
    searchGifs(debouncedSearch);
  }, [debouncedSearch, searchGifs]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Search GIFs"
      size="lg"
      styles={{
        body: {
          padding: 0,
        },
      }}
    >
      <Box p="md">
        <TextInput
          placeholder="Search GIFs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Box>

      <ScrollArea h={400}>
        {loading ? (
          <Center h={200}>
            <Loader />
          </Center>
        ) : (
          <Grid p="md">
            {gifs.map((gif) => (
              <Grid.Col key={gif.id} span={4}>
                <Image
                  src={gif.images.fixed_height.url}
                  alt="GIF"
                  fit="cover"
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    onSelect(gif.images.original.url);
                    onClose();
                  }}
                />
              </Grid.Col>
            ))}
          </Grid>
        )}
      </ScrollArea>
    </Modal>
  );
}
