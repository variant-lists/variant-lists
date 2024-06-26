import GetListBySlugBuilder from "@src/builders/get-list-by-slug.builder";
import { ListPresenter } from "@src/presenters/list.presenter";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

const params = z.object({
	slug: z.string(),
	creatorUsername: z.string(),
});

const response = {
	200: z.object({
		title: z.string(),
		slug: z.string(),
		description: z.string(),
		schemaId: z.string(),
		creatorId: z.string(),
	}),
};

export const getListBySlugController = async (app: FastifyInstance) => {
	app.withTypeProvider<ZodTypeProvider>().get(
		"/:creatorUsername/list/:slug",
		{
			schema: {
				params,
				response,
			},
		},
		async ({ params: { slug, creatorUsername }, user }, reply) => {
			const userId = user.id;

			const getListBySlugBuilder = new GetListBySlugBuilder();
			const getListBySlug = getListBySlugBuilder.build();

			const response = await getListBySlug.execute({
				slug,
				userId,
				creatorUsername,
			});

			reply.send(ListPresenter.toHTTP(response.list));
		},
	);
};
