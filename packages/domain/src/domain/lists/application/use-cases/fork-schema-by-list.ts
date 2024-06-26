import { SchemaRepository } from "@src/domain/lists/application/repositories/schema-repository";
import { ListRepository } from "@src/domain/lists/application/repositories/list-repository";
import { Validator } from "@src/domain/lists/application/services/validator";
import { Schema } from "@src/domain/lists/enterprise/entities/schema";
import { SchemaNotFoundError } from "@src/core/errors/schema-not-found-error";
import { NotValidSchemaError } from "@src/core/errors/not-valid-schema-error";
import { ListNotFoundError } from "@src/core/errors/list-not-found-error";
import { NotAllowedError } from "@src/core/errors";

interface ForkSchemaByListRequest {
	listId: string;
	schemaId: string;
	creatorUsername: string;
	data: Record<string, unknown>;
}

interface ForkSchemaByListResponse {}

export class ForkSchemaByList {
	constructor(
		private schemaRepository: SchemaRepository,
		private listRepository: ListRepository,
		private validator: Validator,
	) {}

	async execute({
		listId,
		schemaId,
		creatorUsername,
		data,
	}: ForkSchemaByListRequest): Promise<ForkSchemaByListResponse> {
		const baseSchema = await this.schemaRepository.findById(schemaId);

		if (!baseSchema) {
			throw new SchemaNotFoundError();
		}

		if (baseSchema.creatorUsername !== creatorUsername) {
			throw new NotAllowedError();
		}

		const isSchemaValid = await this.validator.validateJsonSchema(data);

		if (!isSchemaValid) {
			throw new NotValidSchemaError();
		}

		const list = await this.listRepository.findById(listId);

		if (!list) {
			throw new ListNotFoundError();
		}

		const { title, description } = baseSchema;

		const schema = Schema.create({
			creatorUsername: creatorUsername,
			data: data,
			title,
			description,
		});

		await this.schemaRepository.create(schema);

		list.schemaId = schema.id;

		await this.listRepository.save(list);

		return {};
	}
}
