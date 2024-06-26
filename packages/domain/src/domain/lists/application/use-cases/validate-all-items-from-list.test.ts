import { makeSchema } from "@test/factories/make-schema";
import { InMemorySchemaRepository } from "@test/repositories/in-memory-schema-repository";
import { UniqueEntityID } from "@src/core/entities/uinique-entity-id";
import { ValidateAllItemsFromList } from "@src/domain/lists/application/use-cases/validate-all-items-from-list";
import { InMemoryItemRepository } from "@test/repositories/in-memory-item-repository";
import { InMemoryListRepository } from "@test/repositories/in-memory-list-repository";
import { JsonSchemaValidator } from "@src/domain/lists/application/services/json-schema-validator";
import { makeList } from "@test/factories/make-list";
import { makeItem } from "@test/factories/make-item";
import { ListNotFoundError } from "@src/core/errors/list-not-found-error";
import { NotAllowedError } from "@src/core/errors/not-allowed-error";
import { SchemaNotFoundError } from "@src/core/errors/schema-not-found-error";
import { InMemoryUserRepository } from "@test/repositories";
import { makeUser } from "@test/factories";

let sut: ValidateAllItemsFromList;

let inMemoryItemRepository: InMemoryItemRepository;
let inMemorySchemaRepository: InMemorySchemaRepository;
let inMemoryListRepository: InMemoryListRepository;
let inMemoryUserRepository: InMemoryUserRepository;
let jsonSchemaValidator: JsonSchemaValidator;

describe("Validate Items by list", () => {
	beforeEach(() => {
		inMemorySchemaRepository = new InMemorySchemaRepository();

		inMemoryItemRepository = new InMemoryItemRepository();
		inMemorySchemaRepository = new InMemorySchemaRepository();
		inMemoryListRepository = new InMemoryListRepository();
		inMemoryUserRepository = new InMemoryUserRepository();
		jsonSchemaValidator = new JsonSchemaValidator();

		sut = new ValidateAllItemsFromList(
			inMemoryItemRepository,
			inMemorySchemaRepository,
			inMemoryListRepository,
			inMemoryUserRepository,
			jsonSchemaValidator,
		);
	});

	it("Item should be valid and the lastValidationDate should be updated", async () => {
		const user = makeUser({}, new UniqueEntityID("1"));
		await inMemoryUserRepository.create(user);

		const schema = makeSchema({
			data: {
				type: "object",
				properties: {
					title: {
						type: "string",
					},
				},
				required: ["title"],
			},
		});

		await inMemorySchemaRepository.create(schema);

		const list = makeList({
			schemaId: schema.id,
			creatorUsername: user.username,
		});
		await inMemoryListRepository.create(list);

		const item = makeItem({
			listSlug: list.slug.value,
			creatorUsername: user.username,
			data: {
				name: "My Name",
			},
			isValid: false,
		});

		await inMemoryItemRepository.create(item);

		// Validate the different times
		await new Promise((resolve) => {
			setTimeout(() => {
				resolve(null);
			}, 10);
		});

		schema.data = {
			type: "object",
			properties: {
				name: {
					type: "string",
				},
			},
			required: ["name"],
		};

		await sut.execute({
			creatorId: "1",
			listId: list.id.toString(),
		});

		expect(inMemoryItemRepository.items[0].isValid).toBeTruthy();
		expect(
			inMemoryItemRepository.items[0].lastValidationDate.getTime() >=
				inMemorySchemaRepository.schemas[0].lastUpdateSchemaDate.getTime(),
		).toBeTruthy();
	});

	it("Item should be invalid and the lastValidationDate should be updated", async () => {
		const user = makeUser({}, new UniqueEntityID("1"));
		await inMemoryUserRepository.create(user);

		const schema = makeSchema({
			data: {
				type: "object",
				properties: {
					name: {
						type: "string",
					},
				},
				required: ["name"],
			},
		});

		inMemorySchemaRepository.create(schema);

		const list = makeList({
			schemaId: schema.id,
			creatorUsername: user.username,
		});
		inMemoryListRepository.create(list);

		const item = makeItem({
			listSlug: list.slug.value,
			creatorUsername: user.username,
			data: {
				name: "My Name",
			},
			isValid: true,
		});

		inMemoryItemRepository.create(item);

		await new Promise((resolve) => {
			setTimeout(() => {
				resolve(null);
			}, 10);
		});

		schema.data = {
			type: "object",
			properties: {
				title: {
					type: "string",
				},
			},
			required: ["title"],
		};

		await sut.execute({
			creatorId: "1",
			listId: list.id.toString(),
		});

		expect(inMemoryItemRepository.items[0].isValid).toBeFalsy();
		expect(
			inMemoryItemRepository.items[0].lastValidationDate.getTime() >=
				inMemorySchemaRepository.schemas[0].lastUpdateSchemaDate.getTime(),
		).toBeTruthy();
	});

	it("Item should be invalid first and valid second", async () => {
		const user = makeUser({}, new UniqueEntityID("1"));
		await inMemoryUserRepository.create(user);

		const schema = makeSchema({
			data: {
				type: "object",
				properties: {
					name: {
						type: "string",
					},
				},
				required: ["name"],
			},
		});

		inMemorySchemaRepository.create(schema);

		const list = makeList({
			schemaId: schema.id,
			creatorUsername: user.username,
		});
		inMemoryListRepository.create(list);

		const item1 = makeItem({
			title: "Item 1",
			listSlug: list.slug.value,
			creatorUsername: user.username,
			data: {
				name: "My Name",
			},
			isValid: true,
		});

		inMemoryItemRepository.create(item1);

		const item2 = makeItem({
			title: "Item 2",
			listSlug: list.slug.value,
			creatorUsername: user.username,
			data: {
				title: "My Name",
			},
			isValid: false,
		});

		inMemoryItemRepository.create(item2);

		await new Promise((resolve) => {
			setTimeout(() => {
				resolve(null);
			}, 10);
		});

		schema.data = {
			type: "object",
			properties: {
				title: {
					type: "string",
				},
			},
			required: ["title"],
		};

		await sut.execute({
			creatorId: "1",
			listId: list.id.toString(),
		});

		expect(inMemoryItemRepository.items[0].isValid).toBeFalsy();
		expect(inMemoryItemRepository.items[1].isValid).toBeTruthy();
	});

	it("Should throws not found list error", async () => {
		const schema = makeSchema({});

		inMemorySchemaRepository.create(schema);

		const list = makeList({});
		inMemoryListRepository.create(list);

		expect(async () => {
			await sut.execute({
				creatorId: "1",
				listId: "",
			});
		}).rejects.toBeInstanceOf(ListNotFoundError);
	});

	it("Should throws not allowed error", async () => {
		const schema = makeSchema({});

		inMemorySchemaRepository.create(schema);

		const list = makeList({});
		inMemoryListRepository.create(list);

		expect(async () => {
			await sut.execute({
				creatorId: "1",
				listId: list.id.toString(),
			});
		}).rejects.toBeInstanceOf(NotAllowedError);
	});

	it("Should throws found schema error", async () => {
		const user = makeUser({}, new UniqueEntityID("1"));
		await inMemoryUserRepository.create(user);

		const schema = makeSchema({});

		inMemorySchemaRepository.create(schema);

		const list = makeList({
			creatorUsername: user.username,
		});
		inMemoryListRepository.create(list);

		expect(async () => {
			await sut.execute({
				creatorId: "1",
				listId: list.id.toString(),
			});
		}).rejects.toBeInstanceOf(SchemaNotFoundError);
	});
});
