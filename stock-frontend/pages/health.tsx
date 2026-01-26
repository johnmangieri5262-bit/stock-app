export default function Health() {
    return (
        <div style={{ padding: 50, fontFamily: 'sans-serif' }}>
            <h1>Deployment Health Check</h1>
            <p>Status: <strong>Operational</strong></p>
            <p>Router: Pages Router</p>
            <p>Timestamp: {new Date().toISOString()}</p>
        </div>
    );
}
