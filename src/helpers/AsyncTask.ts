export function AsyncTask(promise:Promise<unknown>) {
	return promise.then(data => [null, data])
		.catch(err => [err]);
}