import adapter from '@sveltejs/adapter-auto';
import preprocess from 'svelte-preprocess';

const config = {
    preprocess: preprocess({
        typescript: {
            tsconfigFile: './tsconfig.json',
        },
    }),
    kit: {
        adapter: adapter()
    }
};

export default config;
