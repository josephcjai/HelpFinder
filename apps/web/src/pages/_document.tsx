import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
                <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;family=Outfit:wght@500;700;800&amp;display=swap" rel="stylesheet" />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    )
}
