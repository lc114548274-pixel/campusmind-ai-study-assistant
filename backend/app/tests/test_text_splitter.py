from app.services.text_splitter import clean_text, split_pages


def test_clean_text_collapses_noise():
    assert clean_text("AI   systems\n\n\nRAG") == "AI systems\n\nRAG"


def test_split_pages_keeps_page_metadata():
    chunks = split_pages([(3, "a" * 120)], chunk_size=50, overlap=10)
    assert len(chunks) == 3
    assert chunks[0].page == 3
    assert chunks[1].index == 1
