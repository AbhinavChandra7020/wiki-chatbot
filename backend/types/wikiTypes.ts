export interface WikipediaContent {
    title: string,
    content: Array<{
        id: number,
        heading: string,
        headingContent: string,
    }>,
    images: string[]
}