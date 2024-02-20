import CreateListBuilder from "@src/builders/create-list.builder";
import { ListPresenter } from "@src/presenters/list.presenter";
import { FastifyInstance } from "fastify";
import z from "zod";

const bodyValidate = z.object({
	title: z.string(),
	description: z.string(),
	schemaId: z.string(),
});

export const createListController = async (app: FastifyInstance) => {
	app.post("/list", async (request, reply) => {
		const creatorId = request.user.id;

		const body = bodyValidate.parse(request.body);

		const listBuilder = new CreateListBuilder();
		const createList = listBuilder.build();

		const { list } = await createList.execute({ ...body, creatorId });

		reply.send(ListPresenter.toHTTP(list));
	});
};