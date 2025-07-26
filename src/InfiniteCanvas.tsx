export function InfiniteCanvas() {
    return (
        <div className="flex flex-col h-full w-full">
        <main className="flex-1 overflow-auto p-4 bg-blue-100">
            <p>这里是无限画布的内容区域。</p>
            <p>您可以在这里添加任何内容，比如文本、图片、图形等。</p>
        </main>
        </div>
    );
}