import app, { start } from "./app"
import config from 'config';


( async () => {
    const port = config.get<number>('app.port')
    const appName = config.get<number>('app.name')
    await start()
    await app.listen(port, () => console.log(`${appName} started on port ${port}`))
})()