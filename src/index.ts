/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

const R2_URL = "https://vpm.azuretek.org"

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const bucket = env.R2_BUCKET;

		// extract repositories
		const repositories: Set<string> = new Set();
		(await bucket.list()).objects.forEach(obj => {
			const repository = obj.key.split("/")[0];
			repositories.add(repository);
		})

		for (const repositoryName of repositories) {
			// repository
			const repositoryBaseJsonRS = (await bucket.get(`${repositoryName}/repository_base.json`))!.body;
			const repositoryBase: RepositoryBaseJson = await parseJson<RepositoryBaseJson>(repositoryBaseJsonRS);
			const repositoryJsonObjectKey = `${repositoryName}/vpm.json`
			const repositoryUrl = `${R2_URL}/${repositoryJsonObjectKey}`
			let repositoryJson: RepositoryJson = {
				name: repositoryBase.name,
				id: repositoryBase.id,
				author: repositoryBase.author,
				url: repositoryUrl,
				packages: {},
			}

			// packages
			const option: R2ListOptions = { prefix: repositoryName }
			const packageJsonR2Objects: R2Object[] = (await bucket.list(option)).objects.filter(obj => obj.key.endsWith("package.json"));

			for (const packageJsonR2Object of packageJsonR2Objects) {
				const jsonReadableStream = (await bucket.get(packageJsonR2Object.key))!.body;
				const packageJson: PackageJson = await parseJson<PackageJson>(jsonReadableStream);

				const zipFindOption: R2ListOptions = { prefix: `${repositoryName}/${packageJson.name}/${packageJson.version}` };
				const zipObjectKey = (await bucket.list(zipFindOption)).objects.filter(obj => obj.key.endsWith(".zip"))[0].key; // zip is always one
				const zipUrl = `${R2_URL}/${zipObjectKey}`;

				const version: Version = {
					name: packageJson.name,
					displayName: packageJson.displayName,
					description: packageJson.description,
					version: packageJson.version,
					unity: packageJson.unity,
					author: {
						name: packageJson.author.name,
						email: packageJson.author.email,
						url: packageJson.author.url,
					},
					url: zipUrl,
					repo: repositoryUrl,
					dependencies: {},
					vpmDependencies: {},
				}

				if (!repositoryJson.packages[packageJson.name]) {
					repositoryJson.packages[packageJson.name] = { versions: {} };
				}
				repositoryJson.packages[packageJson.name].versions[packageJson.version] = version;
			}

			// upload repository json
			const putOption: R2PutOptions = {
				httpMetadata: { contentType: 'application/json' }
			}
			await bucket.put(repositoryJsonObjectKey, JSON.stringify(repositoryJson), putOption);
		}

		return new Response(null, {
			status: 204,
			statusText: 'No Content'
		});
	},
} satisfies ExportedHandler<Env>;

async function parseJson<T>(rs: ReadableStream): Promise<T> {
	const enc = new TextDecoder("utf-8");
	const resp = await new Response(rs).arrayBuffer();
	const data = new Uint8Array(resp);
	const json: T = JSON.parse(enc.decode(data));
	return json;
}
