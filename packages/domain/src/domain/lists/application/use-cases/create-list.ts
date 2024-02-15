import { UniqueEntityID } from "@src/core/entities/uinique-entity-id";
import { List } from "@src/domain/lists/enterprise/entities/list";
import { ListRepository } from "@src/domain/lists/application/repositories/list-repository";

interface CreateListRequest {
	title: string;
	description: string;
	creatorId: string;
	schemaId: string;
}

interface CreateListResponse {
	list: List;
}

export class CreateList {
	constructor(private listRepository: ListRepository) {}

	async execute({
		title,
		description,
		creatorId,
		schemaId,
	}: CreateListRequest): Promise<CreateListResponse | null> {
		const list = List.create({
			title,
			description,
			creatorId: new UniqueEntityID(creatorId),
			schemaId: new UniqueEntityID(schemaId),
		});

		await this.listRepository.create(list);

		return {
			list,
		};
	}
}