// package json
type PackageJson = {
    name: string;
    displayName: string;
    description: string;
    version: string;
    unity?: string;
    author: {
        name: string;
        email?: string;
        url?: string;
    };
    gitDependencies: {
        [package: string]: string;
    };
    vpmDependencies: {
        [package: string]: string;
    };
    legacyFolders: {
        [folder: string]: string;
    };
    legacyFiles: {
        [file: string]: string;
    };
    legacyPackages: {
        [package: string]: string;
    };
    [key: string]: any;
}

// repository json
type RepositoryJson = {
    name: string;
    id: string;
    author: string;
    url: string;
	packages: {
		[packages: string]: {
            versions: {
                [version: string]: Version;
            };
		};
	};
	[key: string]: any;
}

type Version = {
	name: string;
	displayName: string;
    description: string;
    version: string;
    unity?: string;
    author: {
        name: string;
        email?: string;
        url?: string;
    };
    url: string;
    zipSHA256?: string;
    repo: string;
    dependencies: {
        [package: string]: string;
    };
    vpmDependencies: {
        [package: string]: string;
    };
}

// repository base json (read-only)
type RepositoryBaseJson = {
    name: string;
    id: string;
    author: string;
}
